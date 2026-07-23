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
        max_tokens: int = 2048
    ) -> AgentRun:
        raise NotImplementedError

    @abstractmethod
    async def list_for_user(self, user_id: UUID, limit: int = 20) -> list[AgentRun]:
        raise NotImplementedError

    @abstractmethod
    async def delete(self, user_id: UUID, run_id: str) -> None:
        raise NotImplementedError

