from fastapi import APIRouter, Depends, HTTPException, status

from app.application.auth_service import AuthService
from app.domain.exceptions import AuthenticationError, DuplicateUserError
from app.presentation.api.dependencies import get_auth_service
from app.presentation.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse


router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    try:
        result = await auth_service.register(payload.email, payload.password)
    except DuplicateUserError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    return AuthResponse(
        access_token=result.access_token,
        token_type=result.token_type,
        user=UserResponse.from_entity(result.user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    try:
        result = await auth_service.login(payload.email, payload.password)
    except AuthenticationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    return AuthResponse(
        access_token=result.access_token,
        token_type=result.token_type,
        user=UserResponse.from_entity(result.user),
    )

