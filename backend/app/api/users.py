from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.user import UserProfileUpdate, UserResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=ApiResponse[UserResponse])
def get_user_profile(current_user: User = Depends(get_current_user)):
    return ApiResponse(
        success=True,
        data=UserResponse.model_validate(current_user),
    )


@router.put("/profile", response_model=ApiResponse[UserResponse])
def update_user_profile(
    req: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if req.name:
        current_user.name = req.name.strip()
    if req.email:
        current_user.email = req.email.lower()
    db.flush()
    return ApiResponse(
        success=True,
        data=UserResponse.model_validate(current_user),
    )
