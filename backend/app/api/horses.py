from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.horse import Horse
from app.schemas.horse import HorseCreate, HorseResponse, HorseUpdate

router = APIRouter(prefix="/horses", tags=["Horses"])


def generate_horse_code(horse_id: int) -> str:
    return f"H-{horse_id:06d}"


@router.get("", response_model=list[HorseResponse])
def list_horses(db: Session = Depends(get_db)):
    return db.query(Horse).order_by(Horse.name.asc()).all()


@router.post("", response_model=HorseResponse)
def create_horse(payload: HorseCreate, db: Session = Depends(get_db)):
    horse = Horse(**payload.model_dump())

    db.add(horse)
    db.commit()
    db.refresh(horse)

    if not horse.code:
        horse.code = generate_horse_code(horse.id)
        db.commit()
        db.refresh(horse)

    return horse


@router.get("/{horse_id}", response_model=HorseResponse)
def get_horse(horse_id: int, db: Session = Depends(get_db)):
    horse = db.query(Horse).filter(Horse.id == horse_id).first()

    if not horse:
        raise HTTPException(status_code=404, detail="Horse not found")

    return horse


@router.put("/{horse_id}", response_model=HorseResponse)
def update_horse(
    horse_id: int,
    payload: HorseUpdate,
    db: Session = Depends(get_db),
):
    horse = db.query(Horse).filter(Horse.id == horse_id).first()

    if not horse:
        raise HTTPException(status_code=404, detail="Horse not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(horse, field, value)

    db.commit()
    db.refresh(horse)

    return horse


@router.delete("/{horse_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_horse(horse_id: int, db: Session = Depends(get_db)):
    horse = db.query(Horse).filter(Horse.id == horse_id).first()

    if not horse:
        raise HTTPException(status_code=404, detail="Horse not found")

    db.delete(horse)
    db.commit()