from uuid import UUID
from fastapi import APIRouter, Depends, Query

from app.application.agent_service import AgentService
from app.domain.entities.user import User
from app.presentation.api.dependencies import get_agent_service, get_current_user
from app.presentation.schemas.agent import AgentRunRequest, AgentRunResponse


router = APIRouter()


@router.post("/runs", response_model=AgentRunResponse, status_code=201)
async def run_agent(
    payload: AgentRunRequest,
    current_user: User = Depends(get_current_user),
    agent_service: AgentService = Depends(get_agent_service),
) -> AgentRunResponse:
    result = await agent_service.run(
        user_id=current_user.id,
        prompt=payload.prompt,
        model=payload.model,
        temperature=payload.temperature,
        max_tokens=payload.max_tokens,
    )
    return AgentRunResponse.from_entity(result.run)


@router.get("/runs", response_model=list[AgentRunResponse])
async def list_agent_runs(
    current_user: User = Depends(get_current_user),
    agent_service: AgentService = Depends(get_agent_service),
    limit: int = Query(default=20, ge=1, le=100),
) -> list[AgentRunResponse]:
    runs = await agent_service.history(user_id=current_user.id, limit=limit)
    return [AgentRunResponse.from_entity(run) for run in runs]


@router.delete("/runs/{run_id}", status_code=204)
async def delete_agent_run(
    run_id: UUID,
    current_user: User = Depends(get_current_user),
    agent_service: AgentService = Depends(get_agent_service),
) -> None:
    await agent_service.delete_run(user_id=current_user.id, run_id=run_id)
