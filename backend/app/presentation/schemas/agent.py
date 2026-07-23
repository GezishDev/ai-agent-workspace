from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.entities.agent_run import AgentRun


class AgentRunRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=8000)
    model: Optional[str] = "llama-3.3-70b-versatile"
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=1.0)
    max_tokens: Optional[int] = Field(default=2048, ge=1, le=8192)


class AgentRunResponse(BaseModel):
    id: UUID
    prompt: str
    response: str
    created_at: datetime
    model: str
    temperature: float
    max_tokens: int

    @classmethod
    def from_entity(cls, run: AgentRun) -> "AgentRunResponse":
        return cls(
            id=run.id,
            prompt=run.prompt,
            response=run.response,
            created_at=run.created_at,
            model=run.model,
            temperature=run.temperature,
            max_tokens=run.max_tokens,
        )
