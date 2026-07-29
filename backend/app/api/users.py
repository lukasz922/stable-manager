from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import UserUpdate
from app.schemas.user import UserActiveUpdate
from app.schemas.user import PasswordChange

from app.db.session import get_db
from app.schemas.user import (
    UserCreate,
    UserResponse,
)
from app.services.user_service import UserService
from app.core.dependencies import require_permission

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get("", response_model=list[UserResponse])
def get_users(
    current_user=Depends(require_permission("users.manage")),
    db: Session = Depends(get_db),
):
    service = UserService(db)
    return service.get_all()


@router.post("", response_model=UserResponse)
def create_user(
    payload: UserCreate,
    current_user=Depends(require_permission("users.manage")),
    db: Session = Depends(get_db),
):
    service = UserService(db)

    try:
        return service.create(
            username=payload.username,
            full_name=payload.full_name,
            password=payload.password,
            role=payload.role,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UserUpdate,
    current_user=Depends(require_permission("users.manage")),
    db: Session = Depends(get_db),
):
    service = UserService(db)

    try:
        return service.update(
            user_id=user_id,
            username=payload.username,
            full_name=payload.full_name,
            role=payload.role,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{user_id}/active", response_model=UserResponse)
def set_user_active(
    user_id: int,
    payload: UserActiveUpdate,
    current_user=Depends(require_permission("users.manage")),
    db: Session = Depends(get_db),
):
    service = UserService(db)

    try:
        return service.set_active(
            user_id=user_id,
            is_active=payload.is_active,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{user_id}/password", response_model=UserResponse)
def change_user_password(
    user_id: int,
    payload: PasswordChange,
    current_user=Depends(require_permission("users.manage")),
    db: Session = Depends(get_db),
):
    service = UserService(db)

    try:
        return service.change_password(
            user_id=user_id,
            password=payload.password,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user=Depends(require_permission("users.manage")),
    db: Session = Depends(get_db),
):
    service = UserService(db)

    try:
        service.delete(user_id)
        return {"message": "Użytkownik został usunięty."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))