from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.instructor import Instructor
from app.models.role_permission import Role
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nieprawidłowy token.",
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except JWTError as exc:
        raise credentials_exception from exc

    user = db.query(User).filter(User.id == int(user_id)).first()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Konto użytkownika jest zablokowane.",
        )

    return user


def get_user_permissions(
    current_user: User,
    db: Session,
) -> set[str]:
    role = (
        db.query(Role)
        .filter(Role.code == current_user.role)
        .first()
    )

    if role is None:
        return set()

    return {
        permission.code
        for permission in role.permissions
    }


def require_permission(permission_code: str):
    def checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        permissions = get_user_permissions(current_user, db)

        if permission_code not in permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Brak wymaganego uprawnienia: "
                    f"{permission_code}."
                ),
            )

        return current_user

    return checker


def require_roles(*roles):
    def checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Brak uprawnień.",
            )

        return current_user

    return checker


def get_current_instructor(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Instructor:
    if current_user.role != "instructor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="To konto nie ma roli instruktora.",
        )

    instructor = (
        db.query(Instructor)
        .filter(Instructor.user_id == current_user.id)
        .first()
    )

    if instructor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Konto instruktora nie jest połączone "
                "z kartą instruktora."
            ),
        )

    if instructor.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Konto instruktora jest nieaktywne.",
        )

    return instructor