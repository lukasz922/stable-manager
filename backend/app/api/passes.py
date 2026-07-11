from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.client import Client
from app.models.client_pass import Pass
from app.schemas.client_pass import (
    PassCreate,
    PassRead,
    PassUpdate,
)

router = APIRouter(prefix="/passes", tags=["Passes"])


def pass_to_read(pass_obj: Pass) -> PassRead:
    return PassRead(
        id=pass_obj.id,
        client_id=pass_obj.client_id,
        name=pass_obj.name,
        total_entries=pass_obj.total_entries,
        remaining_entries=pass_obj.remaining_entries,
        valid_from=pass_obj.valid_from,
        valid_until=pass_obj.valid_until,
        active=pass_obj.active,
        client_name=(
            f"{pass_obj.client.first_name} {pass_obj.client.last_name}"
            if pass_obj.client
            else None
        ),
    )


@router.get("", response_model=list[PassRead])
def list_passes(db: Session = Depends(get_db)):
    passes = (
        db.query(Pass)
        .options(joinedload(Pass.client))
        .order_by(Pass.valid_until)
        .all()
    )

    return [pass_to_read(item) for item in passes]


@router.get("/{pass_id}", response_model=PassRead)
def get_pass(pass_id: int, db: Session = Depends(get_db)):
    pass_obj = (
        db.query(Pass)
        .options(joinedload(Pass.client))
        .filter(Pass.id == pass_id)
        .first()
    )

    if not pass_obj:
        raise HTTPException(status_code=404, detail="Karnet nie istnieje.")

    return pass_to_read(pass_obj)


@router.post("", response_model=PassRead)
def create_pass(payload: PassCreate, db: Session = Depends(get_db)):
    client = db.get(Client, payload.client_id)

    if not client:
        raise HTTPException(status_code=404, detail="Nie znaleziono klienta.")

    pass_obj = Pass(**payload.model_dump())

    db.add(pass_obj)
    db.commit()
    db.refresh(pass_obj)

    pass_obj = (
        db.query(Pass)
        .options(joinedload(Pass.client))
        .filter(Pass.id == pass_obj.id)
        .first()
    )

    return pass_to_read(pass_obj)


@router.put("/{pass_id}", response_model=PassRead)
def update_pass(
    pass_id: int,
    payload: PassUpdate,
    db: Session = Depends(get_db),
):
    pass_obj = db.get(Pass, pass_id)

    if not pass_obj:
        raise HTTPException(status_code=404, detail="Karnet nie istnieje.")

    values = payload.model_dump(exclude_unset=True)

    if "client_id" in values:
        client = db.get(Client, values["client_id"])

        if not client:
            raise HTTPException(
                status_code=404,
                detail="Nie znaleziono klienta.",
            )

    for key, value in values.items():
        setattr(pass_obj, key, value)

    db.commit()
    db.refresh(pass_obj)

    pass_obj = (
        db.query(Pass)
        .options(joinedload(Pass.client))
        .filter(Pass.id == pass_id)
        .first()
    )

    return pass_to_read(pass_obj)


@router.delete("/{pass_id}", status_code=204)
def delete_pass(pass_id: int, db: Session = Depends(get_db)):
    pass_obj = db.get(Pass, pass_id)

    if not pass_obj:
        raise HTTPException(status_code=404, detail="Karnet nie istnieje.")

    db.delete(pass_obj)
    db.commit()