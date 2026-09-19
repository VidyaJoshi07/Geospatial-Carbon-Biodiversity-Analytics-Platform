from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.common import ApiResponse
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=ApiResponse[UserResponse], status_code=status.HTTP_201_CREATED)
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    user = AuthService.register(db, req)
    return ApiResponse(
        success=True,
        data=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=ApiResponse[TokenResponse])
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    token_resp = AuthService.login(db, req)
    return ApiResponse(
        success=True,
        data=token_resp,
    )


@router.get("/me", response_model=ApiResponse[UserResponse])
def get_me(current_user: User = Depends(get_current_user)):
    return ApiResponse(
        success=True,
        data=UserResponse.model_validate(current_user),
    )


@router.post("/refresh", response_model=ApiResponse[TokenResponse])
def refresh_token(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    token_resp = AuthService.refresh(db, req.refresh_token)
    return ApiResponse(
        success=True,
        data=token_resp,
    )


@router.post("/logout", response_model=ApiResponse[dict])
def logout(current_user: User = Depends(get_current_user)):
    # In stateless JWT, logout is handled by client dropping token, endpoint confirms action
    return ApiResponse(
        success=True,
        data={"message": "Logged out successfully"},
    )
