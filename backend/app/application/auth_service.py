from dataclasses import dataclass

from app.core.config import Settings
from app.core.security import create_access_token, hash_password, verify_password
from app.domain.entities.user import User
from app.domain.exceptions import AuthenticationError, DuplicateUserError
from app.domain.repositories.user_repository import UserRepository


@dataclass(frozen=True, slots=True)
class AuthResult:
    user: User
    access_token: str
    token_type: str = "bearer"


class AuthService:
    def __init__(self, users: UserRepository, settings: Settings) -> None:
        self._users = users
        self._settings = settings

    async def register(self, email: str, password: str) -> AuthResult:
        normalized_email = email.strip().lower()
        existing_user = await self._users.get_by_email(normalized_email)
        if existing_user is not None:
            raise DuplicateUserError("Email is already registered.")

        user = await self._users.create(
            email=normalized_email,
            hashed_password=hash_password(password),
        )
        return AuthResult(user=user, access_token=create_access_token(str(user.id), self._settings))

    async def login(self, email: str, password: str) -> AuthResult:
        normalized_email = email.strip().lower()
        user = await self._users.get_by_email(normalized_email)
        if user is None or not verify_password(password, user.hashed_password):
            raise AuthenticationError("Invalid email or password.")
        if not user.is_active:
            raise AuthenticationError("User account is inactive.")
        return AuthResult(user=user, access_token=create_access_token(str(user.id), self._settings))

