from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.core.dependencies import require_permission
from app.db.session import get_db
from app.models.role_permission import Permission, Role
from app.schemas.role_permission import (
    PermissionRead,
    RolePermissionsUpdate,
    RoleRead,
)


router = APIRouter(
    prefix="/roles",
    tags=["Roles and permissions"],
)


@router.get("", response_model=list[RoleRead])
def get_roles(
    current_user=Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db),
):
    return (
        db.query(Role)
        .options(selectinload(Role.permissions))
        .order_by(Role.name.asc())
        .all()
    )


@router.get("/permissions", response_model=list[PermissionRead])
def get_permissions(
    current_user=Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db),
):
    return (
        db.query(Permission)
        .order_by(
            Permission.module.asc(),
            Permission.name.asc(),
        )
        .all()
    )


@router.put(
    "/{role_id}/permissions",
    response_model=RoleRead,
)
def update_role_permissions(
    role_id: int,
    payload: RolePermissionsUpdate,
    current_user=Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db),
):
    role = (
        db.query(Role)
        .options(selectinload(Role.permissions))
        .filter(Role.id == role_id)
        .first()
    )

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nie znaleziono roli.",
        )

    requested_codes = sorted(set(payload.permission_codes))

    permissions = (
        db.query(Permission)
        .filter(Permission.code.in_(requested_codes))
        .all()
        if requested_codes
        else []
    )

    found_codes = {permission.code for permission in permissions}
    missing_codes = [
        code for code in requested_codes if code not in found_codes
    ]

    if missing_codes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Nieprawidłowe uprawnienia: "
                + ", ".join(missing_codes)
            ),
        )

    if role.code == "instructor":
        instructor_permission = (
            db.query(Permission)
            .filter(Permission.code == "instructor.panel")
            .first()
        )
        if (
            instructor_permission is not None
            and instructor_permission not in permissions
        ):
            permissions.append(instructor_permission)
    else:
        permissions = [
            permission
            for permission in permissions
            if permission.code != "instructor.panel"
        ]

    if role.code == "admin":
        roles_manage = (
            db.query(Permission)
            .filter(Permission.code == "roles.manage")
            .first()
        )
        if roles_manage is not None and roles_manage not in permissions:
            permissions.append(roles_manage)

    role.permissions = sorted(
        permissions,
        key=lambda permission: permission.code,
    )

    db.commit()
    db.refresh(role)

    return role
