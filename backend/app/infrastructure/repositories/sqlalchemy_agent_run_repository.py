"""SQLAlchemy implementation of AgentRunRepository."""

from uuid import UUID

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.agent_run import AgentRun
from app.domain.repositories.agent_run_repository import AgentRunRepository
from app.infrastructure.database.models import AgentRunModel


class SqlAlchemyAgentRunRepository(AgentRunRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        user_id: UUID,
        prompt: str,
        response: str,
        model: str = "llama-3.3-70b-versatile",
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AgentRun:
        model_obj = AgentRunModel(
            user_id=str(user_id),
            prompt=prompt,
            response=response,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        self._session.add(model_obj)
        await self._session.commit()
        await self._session.refresh(model_obj)
        return self._to_entity(model_obj)

    async def get_by_id(self, run_id: UUID, user_id: UUID) -> AgentRun | None:
        """Return the run only when it belongs to the requesting user."""
        result = await self._session.execute(
            select(AgentRunModel).where(
                AgentRunModel.id == str(run_id),
                AgentRunModel.user_id == str(user_id),
            )
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_for_user(
        self, user_id: UUID, limit: int = 20, offset: int = 0
    ) -> list[AgentRun]:
        result = await self._session.execute(
            select(AgentRunModel)
            .where(AgentRunModel.user_id == str(user_id))
            .order_by(desc(AgentRunModel.created_at))
            .limit(limit)
            .offset(offset)
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def delete(self, user_id: UUID, run_id: UUID) -> None:
        result = await self._session.execute(
            select(AgentRunModel).where(
                AgentRunModel.id == str(run_id),
                AgentRunModel.user_id == str(user_id),
            )
        )
        model = result.scalar_one_or_none()
        if model:
            await self._session.delete(model)
            await self._session.commit()

    @staticmethod
    def _to_entity(model: AgentRunModel) -> AgentRun:
        return AgentRun(
            id=UUID(model.id),
            user_id=UUID(model.user_id),
            prompt=model.prompt,
            response=model.response,
            created_at=model.created_at,
            model=model.model,
            temperature=model.temperature,
            max_tokens=model.max_tokens,
        )
