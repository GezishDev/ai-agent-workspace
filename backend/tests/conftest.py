"""Shared test fixtures for the AI Agent Workspace backend test suite.

Uses an in-memory SQLite database so tests never touch a real PostgreSQL instance.
The `test_client` fixture wires the FastAPI dependency graph to use that database
and exposes an HTTPX AsyncClient for integration tests.
"""

from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import Settings
from app.infrastructure.database.base import Base
import app.infrastructure.database.models  # noqa: F401 — register models

# ---------------------------------------------------------------------------
# Test settings — isolated SQLite, deterministic JWT secret
# ---------------------------------------------------------------------------

TEST_SETTINGS = Settings(
    database_url="sqlite+aiosqlite:///:memory:",
    jwt_secret_key="test-secret-key-that-is-at-least-32-chars",
    groq_api_key=None,  # no real LLM calls in tests
)

# ---------------------------------------------------------------------------
# Per-test async SQLite engine + session
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def db_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine):
    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with factory() as session:
        yield session


# ---------------------------------------------------------------------------
# FastAPI integration client wired to the test database
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def test_client(db_engine):
    """HTTPX AsyncClient backed by an in-memory SQLite database."""
    from app.main import create_app
    from app.infrastructure.database.session import get_session
    from app.core.config import get_settings

    app = create_app(settings=TEST_SETTINGS)

    # Override the session dependency with our test engine
    test_factory = async_sessionmaker(db_engine, expire_on_commit=False)

    async def override_get_session():
        async with test_factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[get_settings] = lambda: TEST_SETTINGS

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client


# ---------------------------------------------------------------------------
# Convenience: register a user and return auth headers
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def auth_headers(test_client: AsyncClient) -> dict[str, str]:
    resp = await test_client.post(
        "/api/v1/auth/register",
        json={"email": "fixture@example.com", "password": "fixture-password-ok"},
    )
    assert resp.status_code == 201
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def other_auth_headers(test_client: AsyncClient) -> dict[str, str]:
    """A second user — used for isolation tests."""
    resp = await test_client.post(
        "/api/v1/auth/register",
        json={"email": "other@example.com", "password": "other-password-ok-12"},
    )
    assert resp.status_code == 201
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
