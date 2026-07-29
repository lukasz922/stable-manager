from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import require_permission
from app.db.session import get_db
from app.models.horse import Horse
from app.schemas.horse import HorseCreate, HorseResponse, HorseUpdate


router = APIRouter(prefix="/horses", tags=["Horses"])


def generate_horse_code(horse_id: int) -> str:
    return f"H-{horse_id:06d}"


def get_horse_or_404(db: Session, horse_id: int) -> Horse:
    horse = db.query(Horse).filter(Horse.id == horse_id).first()

    if not horse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nie znaleziono konia.",
        )

    return horse


@router.get("", response_model=list[HorseResponse])
def list_horses(
    current_user=Depends(require_permission("horses.view")),
    db: Session = Depends(get_db),
):
    return db.query(Horse).order_by(Horse.name.asc()).all()


@router.post("", response_model=HorseResponse)
def create_horse(
    payload: HorseCreate,
    current_user=Depends(require_permission("horses.manage")),
    db: Session = Depends(get_db),
):
    horse = Horse(**payload.model_dump())
    db.add(horse)

    try:
        db.commit()
        db.refresh(horse)

        if not horse.code:
            horse.code = generate_horse_code(horse.id)
            db.commit()
            db.refresh(horse)

        return horse
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Nie można zapisać konia. Sprawdź wprowadzone dane.",
        )


@router.get("/{horse_id}", response_model=HorseResponse)
def get_horse(
    horse_id: int,
    current_user=Depends(require_permission("horses.view")),
    db: Session = Depends(get_db),
):
    return get_horse_or_404(db, horse_id)


@router.put("/{horse_id}", response_model=HorseResponse)
def update_horse(
    horse_id: int,
    payload: HorseUpdate,
    current_user=Depends(require_permission("horses.manage")),
    db: Session = Depends(get_db),
):
    horse = get_horse_or_404(db, horse_id)

    for field, value in payload.model_dump(
        exclude_unset=True
    ).items():
        setattr(horse, field, value)

    try:
        db.commit()
        db.refresh(horse)
        return horse
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Nie można zapisać zmian konia.",
        )


@router.delete(
    "/{horse_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_horse(
    horse_id: int,
    current_user=Depends(require_permission("horses.manage")),
    db: Session = Depends(get_db),
):
    horse = get_horse_or_404(db, horse_id)

    try:
        db.delete(horse)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Nie można usunąć konia, ponieważ posiada "
                "powiązane jazdy lub historię. Zmień jego status "
                "na „Niedostępny”, aby zachować wcześniejsze dane."
            ),
        )