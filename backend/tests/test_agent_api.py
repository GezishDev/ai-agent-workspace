"""Integration tests for /api/v1/agents/runs endpoints.

Key things verified:
- Authenticated users can create, list, and delete their own runs.
- Users CANNOT access or delete another user's runs (isolation).
- Pagination parameters are respected.
- The agent falls back gracefully when GROQ_API_KEY is absent.
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# Agent run creation
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_run_agent_returns_201(
    test_client: AsyncClient, auth_headers: dict
) -> None:
    resp = await test_client.post(
        "/api/v1/agents/runs",
        json={"prompt": "Say hello"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert "id" in body
    assert body["prompt"] == "Say hello"
    # Response contains a non-empty string (fallback message when no API key)
    assert isinstance(body["response"], str)
    assert len(body["response"]) > 0
    assert "model" in body
    assert "temperature" in body
    assert "max_tokens" in body


@pytest.mark.asyncio
async def test_run_agent_accepts_model_params(
    test_client: AsyncClient, auth_headers: dict
) -> None:
    resp = await test_client.post(
        "/api/v1/agents/runs",
        json={
            "prompt": "Test prompt",
            "model": "llama-3.1-8b-instant",
            "temperature": 0.3,
            "max_tokens": 512,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["model"] == "llama-3.1-8b-instant"
    assert body["temperature"] == 0.3
    assert body["max_tokens"] == 512


@pytest.mark.asyncio
async def test_run_agent_rejects_empty_prompt(
    test_client: AsyncClient, auth_headers: dict
) -> None:
    resp = await test_client.post(
        "/api/v1/agents/runs",
        json={"prompt": ""},
        headers=auth_headers,
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_run_agent_rejects_prompt_too_long(
    test_client: AsyncClient, auth_headers: dict
) -> None:
    resp = await test_client.post(
        "/api/v1/agents/runs",
        json={"prompt": "x" * 8001},
        headers=auth_headers,
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_run_agent_rejects_unauthenticated(test_client: AsyncClient) -> None:
    resp = await test_client.post(
        "/api/v1/agents/runs", json={"prompt": "hello"}
    )
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Listing runs
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_runs_returns_own_runs(
    test_client: AsyncClient, auth_headers: dict
) -> None:
    # Create two runs
    for i in range(2):
        await test_client.post(
            "/api/v1/agents/runs",
            json={"prompt": f"Prompt {i}"},
            headers=auth_headers,
        )
    resp = await test_client.get("/api/v1/agents/runs", headers=auth_headers)
    assert resp.status_code == 200
    runs = resp.json()
    assert len(runs) == 2
    # Most recent first
    assert runs[0]["prompt"] == "Prompt 1"


@pytest.mark.asyncio
async def test_list_runs_pagination(
    test_client: AsyncClient, auth_headers: dict
) -> None:
    for i in range(5):
        await test_client.post(
            "/api/v1/agents/runs",
            json={"prompt": f"Paginated {i}"},
            headers=auth_headers,
        )
    page1 = await test_client.get(
        "/api/v1/agents/runs?limit=3&offset=0", headers=auth_headers
    )
    page2 = await test_client.get(
        "/api/v1/agents/runs?limit=3&offset=3", headers=auth_headers
    )
    assert len(page1.json()) == 3
    assert len(page2.json()) == 2


@pytest.mark.asyncio
async def test_list_runs_empty_for_new_user(
    test_client: AsyncClient, auth_headers: dict
) -> None:
    resp = await test_client.get("/api/v1/agents/runs", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []


# ---------------------------------------------------------------------------
# User isolation — critical security requirement
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_user_cannot_see_other_users_runs(
    test_client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
) -> None:
    # User A creates a run
    await test_client.post(
        "/api/v1/agents/runs",
        json={"prompt": "Secret user A prompt"},
        headers=auth_headers,
    )
    # User B lists runs — should see nothing
    resp = await test_client.get("/api/v1/agents/runs", headers=other_auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_user_cannot_delete_other_users_run(
    test_client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
) -> None:
    # User A creates a run
    create_resp = await test_client.post(
        "/api/v1/agents/runs",
        json={"prompt": "User A run to protect"},
        headers=auth_headers,
    )
    run_id = create_resp.json()["id"]

    # User B tries to delete it — must get 404 (not 403, not 204)
    del_resp = await test_client.delete(
        f"/api/v1/agents/runs/{run_id}", headers=other_auth_headers
    )
    assert del_resp.status_code == 404

    # Run must still exist for User A
    list_resp = await test_client.get("/api/v1/agents/runs", headers=auth_headers)
    assert any(r["id"] == run_id for r in list_resp.json())


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_delete_own_run(
    test_client: AsyncClient, auth_headers: dict
) -> None:
    create_resp = await test_client.post(
        "/api/v1/agents/runs",
        json={"prompt": "Delete me"},
        headers=auth_headers,
    )
    run_id = create_resp.json()["id"]

    del_resp = await test_client.delete(
        f"/api/v1/agents/runs/{run_id}", headers=auth_headers
    )
    assert del_resp.status_code == 204

    list_resp = await test_client.get("/api/v1/agents/runs", headers=auth_headers)
    assert not any(r["id"] == run_id for r in list_resp.json())


@pytest.mark.asyncio
async def test_delete_nonexistent_run_returns_404(
    test_client: AsyncClient, auth_headers: dict
) -> None:
    fake_id = "00000000-0000-0000-0000-000000000000"
    resp = await test_client.delete(
        f"/api/v1/agents/runs/{fake_id}", headers=auth_headers
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Health endpoint (sanity check)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_health_returns_ok(test_client: AsyncClient) -> None:
    resp = await test_client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
