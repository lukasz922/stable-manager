from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import require_permission
from app.db.session import get_db
from app.models.instructor import Instructor
from app.models.user import User
from app.schemas.instructor import (
    InstructorCreate,
    InstructorRead,
    InstructorUpdate,
    InstructorUserLink,
)


router = APIRouter(prefix="/instructors", tags=["Instructors"])


def generate_instructor_code(instructor_id: int) -> str:
    return f"I-{instructor_id:06d}"


def get_instructor_or_404(
    db: Session,
    instructor_id: int,
) -> Instructor:
    instructor = db.get(Instructor, instructor_id)

    if instructor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nie znaleziono instruktora.",
        )

    return instructor


@router.get("", response_model=list[InstructorRead])
def list_instructors(
    current_user=Depends(
        require_permission("instructors.view")
    ),
    db: Session = Depends(get_db),
):
    return (
        db.query(Instructor)
        .order_by(
            Instructor.last_name.asc(),
            Instructor.first_name.asc(),
        )
        .all()
    )


@router.post("", response_model=InstructorRead)
def create_instructor(
    payload: InstructorCreate,
    current_user=Depends(
        require_permission("instructors.manage")
    ),
    db: Session = Depends(get_db),
):
    instructor = Instructor(**payload.model_dump())
    db.add(instructor)

    try:
        db.commit()
        db.refresh(instructor)

        if not instructor.code:
            instructor.code = generate_instructor_code(
                instructor.id
            )
            db.commit()
            db.refresh(instructor)

        return instructor
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Nie można zapisać instruktora. "
                "Sprawdź wprowadzone dane."
            ),
        )


@router.put(
    "/{instructor_id}/user",
    response_model=InstructorRead,
)
def link_user_account(
    instructor_id: int,
    payload: InstructorUserLink,
    current_user=Depends(
        require_permission("instructors.manage")
    ),
    db: Session = Depends(get_db),
):
    instructor = get_instructor_or_404(
        db,
        instructor_id,
    )
    user = db.get(User, payload.user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nie znaleziono użytkownika.",
        )

    if user.role != "instructor":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Z instruktorem można powiązać wyłącznie konto "
                "użytkownika z rolą „Instruktor”."
            ),
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Nie można powiązać nieaktywnego konta "
                "użytkownika."
            ),
        )

    already_linked = (
        db.query(Instructor)
        .filter(
            Instructor.user_id == user.id,
            Instructor.id != instructor.id,
        )
        .first()
    )

    if already_linked is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "To konto użytkownika jest już powiązane "
                "z innym instruktorem."
            ),
        )

    instructor.user_id = user.id

    try:
        db.commit()
        db.refresh(instructor)
        return instructor
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Nie udało się powiązać konta użytkownika "
                "z instruktorem."
            ),
        )


@router.delete(
    "/{instructor_id}/user",
    response_model=InstructorRead,
)
def unlink_user_account(
    instructor_id: int,
    current_user=Depends(
        require_permission("instructors.manage")
    ),
    db: Session = Depends(get_db),
):
    instructor = get_instructor_or_404(
        db,
        instructor_id,
    )
    instructor.user_id = None
    db.commit()
    db.refresh(instructor)
    return instructor


@router.get(
    "/{instructor_id}",
    response_model=InstructorRead,
)
def get_instructor(
    instructor_id: int,
    current_user=Depends(
        require_permission("instructors.view")
    ),
    db: Session = Depends(get_db),
):
    return get_instructor_or_404(
        db,
        instructor_id,
    )


@router.put(
    "/{instructor_id}",
    response_model=InstructorRead,
)
def update_instructor(
    instructor_id: int,
    payload: InstructorUpdate,
    current_user=Depends(
        require_permission("instructors.manage")
    ),
    db: Session = Depends(get_db),
):
    instructor = get_instructor_or_404(
        db,
        instructor_id,
    )

    for field, value in payload.model_dump(
        exclude_unset=True
    ).items():
        setattr(instructor, field, value)

    try:
        db.commit()
        db.refresh(instructor)
        return instructor
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Nie można zapisać zmian instruktora.",
        )


@router.delete(
    "/{instructor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_instructor(
    instructor_id: int,
    current_user=Depends(
        require_permission("instructors.manage")
    ),
    db: Session = Depends(get_db),
):
    instructor = get_instructor_or_404(
        db,
        instructor_id,
    )

    try:
        db.delete(instructor)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Nie można usunąć instruktora, ponieważ posiada "
                "powiązane jazdy, grafik lub historię. "
                "Zmień jego status na „Nieaktywny”, aby zachować dane."
            ),
        )