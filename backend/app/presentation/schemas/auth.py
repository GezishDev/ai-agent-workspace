from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.domain.entities.user import User


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    is_active: bool
    created_at: datetime

    @classmethod
    def from_entity(cls, user: User) -> "UserResponse":
        return cls(
            id=user.id,
            email=user.email,
            is_active=user.is_active,
            created_at=user.created_at,
        )


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

