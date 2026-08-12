"""AgentRunRepository contract.

Defines the interface that infrastructure implementations must satisfy.
The domain layer has no dependency on SQLAlchemy or any ORM.
"""

from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.agent_run import AgentRun


class AgentRunRepository(ABC):

    @abstractmethod
    async def create(
        self,
        user_id: UUID,
        prompt: str,
        response: str,
        model: str = "llama-3.3-70b-versatile",
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AgentRun:
        raise NotImplementedError

    @abstractmethod
    async def get_by_id(self, run_id: UUID, user_id: UUID) -> AgentRun | None:
        """Return the run only if it belongs to the given user (ownership check)."""
        raise NotImplementedError

    @abstractmethod
    async def list_for_user(
        self, user_id: UUID, limit: int = 20, offset: int = 0
    ) -> list[AgentRun]:
        raise NotImplementedError

    @abstractmethod
    async def delete(self, user_id: UUID, run_id: UUID) -> None:
        raise NotImplementedError
