"""Agent application service.

Orchestrates the LangGraph agent workflow and persists run results.
The Groq async client is used so the event loop is never blocked.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated, TypedDict
from uuid import UUID

from groq import AsyncGroq
from langgraph.graph import END, StateGraph

from app.core.config import Settings
from app.domain.entities.agent_run import AgentRun
from app.domain.exceptions import NotFoundError
from app.domain.repositories.agent_run_repository import AgentRunRepository


# ---------------------------------------------------------------------------
# Graph state
# ---------------------------------------------------------------------------

class AgentState(TypedDict):
    prompt: str
    response: str
    model: str
    temperature: float
    max_tokens: int


# ---------------------------------------------------------------------------
# Service result
# ---------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class AgentResponse:
    run: AgentRun


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class AgentService:
    """Coordinates the agent workflow and run persistence."""

    def __init__(self, agent_runs: AgentRunRepository, settings: Settings) -> None:
        self._agent_runs = agent_runs
        self._settings = settings
        # Use async client so we never block the event loop
        self._client: AsyncGroq | None = (
            AsyncGroq(api_key=settings.groq_api_key) if settings.groq_api_key else None
        )
        self._graph = self._build_graph()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def run(
        self,
        user_id: UUID,
        prompt: str,
        model: str = "llama-3.3-70b-versatile",
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AgentResponse:
        result = await self._graph.ainvoke(
            {
                "prompt": prompt,
                "response": "",
                "model": model,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
        )
        run = await self._agent_runs.create(
            user_id=user_id,
            prompt=prompt,
            response=result["response"],
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return AgentResponse(run=run)

    async def history(self, user_id: UUID, limit: int = 20, offset: int = 0) -> list[AgentRun]:
        return await self._agent_runs.list_for_user(
            user_id=user_id, limit=limit, offset=offset
        )

    async def get_run(self, user_id: UUID, run_id: UUID) -> AgentRun:
        run = await self._agent_runs.get_by_id(run_id=run_id, user_id=user_id)
        if run is None:
            raise NotFoundError(f"Run {run_id} not found.")
        return run

    async def delete_run(self, user_id: UUID, run_id: UUID) -> None:
        run = await self._agent_runs.get_by_id(run_id=run_id, user_id=user_id)
        if run is None:
            raise NotFoundError(f"Run {run_id} not found.")
        await self._agent_runs.delete(user_id=user_id, run_id=run_id)

    # ------------------------------------------------------------------
    # Graph
    # ------------------------------------------------------------------

    def _build_graph(self) -> object:
        graph: StateGraph = StateGraph(AgentState)
        graph.add_node("respond", self._respond)
        graph.set_entry_point("respond")
        graph.add_edge("respond", END)
        return graph.compile()

    async def _respond(self, state: AgentState) -> AgentState:
        """LLM response node. Uses AsyncGroq so the event loop is not blocked."""
        prompt: str = state["prompt"].strip()
        model: str = state.get("model", "llama-3.3-70b-versatile")
        temperature: float = state.get("temperature", 0.7)
        max_tokens: int = state.get("max_tokens", 2048)

        if self._client is None:
            response = (
                "[Agent unconfigured] GROQ_API_KEY is not set. "
                f"Your prompt was: {prompt}"
            )
            return {
                "prompt": prompt,
                "response": response,
                "model": model,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }

        try:
            completion = await self._client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            response = (
                completion.choices[0].message.content
                or "The agent returned an empty response."
            )
        except Exception as exc:  # noqa: BLE001
            response = f"Agent request failed: {exc}"

        return {
            "prompt": prompt,
            "response": response,
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }