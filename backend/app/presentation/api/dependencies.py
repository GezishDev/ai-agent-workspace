from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.agent_service import AgentService
from app.application.auth_service import AuthService
from app.core.config import Settings, get_settings
from app.core.security import decode_access_token
from app.domain.entities.user import User
from app.infrastructure.database.session import get_session
from app.infrastructure.repositories.sqlalchemy_agent_run_repository import SqlAlchemyAgentRunRepository
from app.infrastructure.repositories.sqlalchemy_user_repository import SqlAlchemyUserRepository


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_auth_service(
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> AuthService:
    return AuthService(users=SqlAlchemyUserRepository(session), settings=settings)


async def get_agent_service(
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> AgentService:
    return AgentService(agent_runs=SqlAlchemyAgentRunRepository(session), settings=settings)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> User:
    subject = decode_access_token(token, settings)
    if subject is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await SqlAlchemyUserRepository(session).get_by_id(UUID(subject))
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    return user