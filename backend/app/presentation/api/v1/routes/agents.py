"""Agent run endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.application.agent_service import AgentService
from app.domain.entities.user import User
from app.domain.exceptions import NotFoundError
from app.presentation.api.dependencies import get_agent_service, get_current_user
from app.presentation.schemas.agent import AgentRunRequest, AgentRunResponse

router = APIRouter()


@router.post("/runs", response_model=AgentRunResponse, status_code=status.HTTP_201_CREATED)
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
    offset: int = Query(default=0, ge=0),
) -> list[AgentRunResponse]:
    runs = await agent_service.history(
        user_id=current_user.id, limit=limit, offset=offset
    )
    return [AgentRunResponse.from_entity(run) for run in runs]


@router.get("/runs/{run_id}", response_model=AgentRunResponse)
async def get_agent_run(
    run_id: UUID,
    current_user: User = Depends(get_current_user),
    agent_service: AgentService = Depends(get_agent_service),
) -> AgentRunResponse:
    try:
        run = await agent_service.get_run(user_id=current_user.id, run_id=run_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return AgentRunResponse.from_entity(run)


@router.delete("/runs/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent_run(
    run_id: UUID,
    current_user: User = Depends(get_current_user),
    agent_service: AgentService = Depends(get_agent_service),
) -> None:
    try:
        await agent_service.delete_run(user_id=current_user.id, run_id=run_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
