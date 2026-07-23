from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True, slots=True)
class AgentRun:
    id: UUID
    user_id: UUID
    prompt: str
    response: str
    created_at: datetime
    model: str = "llama-3.3-70b-versatile"
    temperature: float = 0.7
    max_tokens: int = 2048

