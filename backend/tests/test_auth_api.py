"""Integration tests for the /api/v1/auth endpoints.

These run against a real FastAPI app backed by an in-memory SQLite database.
They verify the full HTTP stack: routing, validation, service, repository.
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_register_success(test_client: AsyncClient) -> None:
    resp = await test_client.post(
        "/api/v1/auth/register",
        json={"email": "new@example.com", "password": "twelve-char-pw"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert "access_token" in body
    assert body["user"]["email"] == "new@example.com"
    assert body["user"]["is_active"] is True
    # hashed_password must NOT appear in the response
    assert "hashed_password" not in body["user"]


@pytest.mark.asyncio
async def test_register_duplicate_email_returns_409(test_client: AsyncClient) -> None:
    payload = {"email": "dup@example.com", "password": "twelve-char-pw"}
    await test_client.post("/api/v1/auth/register", json=payload)
    resp = await test_client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_register_email_is_case_normalised(test_client: AsyncClient) -> None:
    await test_client.post(
        "/api/v1/auth/register",
        json={"email": "UPPER@example.com", "password": "twelve-char-pw"},
    )
    resp = await test_client.post(
        "/api/v1/auth/register",
        json={"email": "upper@example.com", "password": "twelve-char-pw"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_register_rejects_short_password(test_client: AsyncClient) -> None:
    resp = await test_client.post(
        "/api/v1/auth/register",
        json={"email": "short@example.com", "password": "short"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_rejects_invalid_email(test_client: AsyncClient) -> None:
    resp = await test_client.post(
        "/api/v1/auth/register",
        json={"email": "not-an-email", "password": "twelve-char-pw"},
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_login_success(test_client: AsyncClient) -> None:
    await test_client.post(
        "/api/v1/auth/register",
        json={"email": "login@example.com", "password": "twelve-char-pw"},
    )
    resp = await test_client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "twelve-char-pw"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["user"]["email"] == "login@example.com"


@pytest.mark.asyncio
async def test_login_wrong_password_returns_401(test_client: AsyncClient) -> None:
    await test_client.post(
        "/api/v1/auth/register",
        json={"email": "wpass@example.com", "password": "twelve-char-pw"},
    )
    resp = await test_client.post(
        "/api/v1/auth/login",
        json={"email": "wpass@example.com", "password": "wrong-password"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email_returns_401(test_client: AsyncClient) -> None:
    resp = await test_client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "twelve-char-pw"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_error_does_not_reveal_reason(test_client: AsyncClient) -> None:
    """Auth failure messages must not distinguish unknown-user from wrong-password."""
    resp_unknown = await test_client.post(
        "/api/v1/auth/login",
        json={"email": "ghost@example.com", "password": "twelve-char-pw"},
    )
    await test_client.post(
        "/api/v1/auth/register",
        json={"email": "real@example.com", "password": "twelve-char-pw"},
    )
    resp_wrong_pw = await test_client.post(
        "/api/v1/auth/login",
        json={"email": "real@example.com", "password": "wrong-password-x"},
    )
    assert resp_unknown.json()["detail"] == resp_wrong_pw.json()["detail"]


# ---------------------------------------------------------------------------
# Protected endpoints — unauthenticated access
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_protected_endpoint_rejects_no_token(test_client: AsyncClient) -> None:
    resp = await test_client.get("/api/v1/agents/runs")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_protected_endpoint_rejects_invalid_token(test_client: AsyncClient) -> None:
    resp = await test_client.get(
        "/api/v1/agents/runs",
        headers={"Authorization": "Bearer this.is.invalid"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_protected_endpoint_rejects_malformed_header(test_client: AsyncClient) -> None:
    resp = await test_client.get(
        "/api/v1/agents/runs",
        headers={"Authorization": "NotBearer sometoken"},
    )
    assert resp.status_code == 401
