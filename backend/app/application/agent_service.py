from dataclasses import dataclass
from typing import TypedDict
from uuid import UUID

from groq import Groq
from langgraph.graph import END, StateGraph

from app.core.config import Settings
from app.domain.entities.agent_run import AgentRun
from app.domain.repositories.agent_run_repository import AgentRunRepository


class AgentState(TypedDict):
    prompt: str
    response: str
    model: str
    temperature: float
    max_tokens: int


@dataclass(frozen=True, slots=True)
class AgentResponse:
    run: AgentRun


class AgentService:
    def __init__(self, agent_runs: AgentRunRepository, settings: Settings) -> None:
        self._agent_runs = agent_runs
        self._settings = settings
        self._client = Groq(api_key=settings.groq_api_key) if settings.groq_api_key else None
        self._graph = self._build_graph()

    async def run(
        self,
        user_id: UUID,
        prompt: str,
        model: str = "llama-3.3-70b-versatile",
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> AgentResponse:
        result = await self._graph.ainvoke({
            "prompt": prompt,
            "response": "",
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens
        })
        run = await self._agent_runs.create(
            user_id=user_id,
            prompt=prompt,
            response=result["response"],
            model=model,
            temperature=temperature,
            max_tokens=max_tokens
        )
        return AgentResponse(run=run)

    async def history(self, user_id: UUID, limit: int = 20) -> list[AgentRun]:
        return await self._agent_runs.list_for_user(user_id=user_id, limit=limit)

    async def delete_run(self, user_id: UUID, run_id: str) -> None:
        await self._agent_runs.delete(user_id=user_id, run_id=run_id)

    def _build_graph(self):
        graph = StateGraph(AgentState)
        graph.add_node("respond", self._respond)
        graph.set_entry_point("respond")
        graph.add_edge("respond", END)
        return graph.compile()

    async def _respond(self, state: AgentState) -> AgentState:
        prompt = state["prompt"].strip()
        model = state.get("model", "llama-3.3-70b-versatile")
        temperature = state.get("temperature", 0.7)
        max_tokens = state.get("max_tokens", 2048)

        if self._client is None:
            response = (
                "Agent is not configured: GROQ_API_KEY is missing. "
                f"Your request was: {prompt}"
            )
            return {
                "prompt": prompt,
                "response": response,
                "model": model,
                "temperature": temperature,
                "max_tokens": max_tokens
            }

        try:
            completion = self._client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens
            )
            response = completion.choices[0].message.content or "The agent returned an empty response."
        except Exception as exc:  # noqa: BLE001
            response = f"Agent request failed: {exc}"

        return {
            "prompt": prompt,
            "response": response,
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens
        }