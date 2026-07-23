from datetime import UTC, datetime
from uuid import uuid4

import pytest

from app.application.auth_service import AuthService
from app.core.config import Settings
from app.core.security import hash_password
from app.domain.entities.user import User
from app.domain.exceptions import AuthenticationError, DuplicateUserError
from app.domain.repositories.user_repository import UserRepository


class InMemoryUserRepository(UserRepository):
    def __init__(self) -> None:
        self.users: dict[str, User] = {}

    async def get_by_id(self, user_id):
        return next((user for user in self.users.values() if user.id == user_id), None)

    async def get_by_email(self, email: str):
        return self.users.get(email)

    async def create(self, email: str, hashed_password: str):
        user = User(
            id=uuid4(),
            email=email,
            hashed_password=hashed_password,
            is_active=True,
            created_at=datetime.now(UTC),
        )
        self.users[email] = user
        return user


def build_settings() -> Settings:
    return Settings(jwt_secret_key="test-secret-key-with-at-least-32-chars")


@pytest.mark.asyncio
async def test_register_creates_user_and_token() -> None:
    repository = InMemoryUserRepository()
    service = AuthService(repository, build_settings())

    result = await service.register("USER@example.com", "very-secure-password")

    assert result.user.email == "user@example.com"
    assert result.access_token


@pytest.mark.asyncio
async def test_register_rejects_duplicate_email() -> None:
    repository = InMemoryUserRepository()
    service = AuthService(repository, build_settings())
    await service.register("user@example.com", "very-secure-password")

    with pytest.raises(DuplicateUserError):
        await service.register("USER@example.com", "very-secure-password")


@pytest.mark.asyncio
async def test_login_rejects_invalid_password() -> None:
    repository = InMemoryUserRepository()
    repository.users["user@example.com"] = User(
        id=uuid4(),
        email="user@example.com",
        hashed_password=hash_password("correct-password"),
        is_active=True,
        created_at=datetime.now(UTC),
    )
    service = AuthService(repository, build_settings())

    with pytest.raises(AuthenticationError):
        await service.login("user@example.com", "wrong-password")

