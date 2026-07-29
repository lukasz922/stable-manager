from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import require_permission
from app.db.session import get_db
from app.models.client import Client
from app.models.client_pass import Pass
from app.schemas.client_pass import PassCreate, PassRead, PassUpdate


router = APIRouter(prefix="/passes", tags=["Passes"])


def get_pass_or_404(db: Session, pass_id: int) -> Pass:
    pass_obj = (
        db.query(Pass)
        .options(joinedload(Pass.client))
        .filter(Pass.id == pass_id)
        .first()
    )

    if pass_obj is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Karnet nie istnieje.",
        )

    return pass_obj


def validate_pass_values(
    total_entries: int,
    remaining_entries: int,
    valid_from,
    valid_until,
) -> None:
    if total_entries <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Liczba wszystkich wejść musi być większa od zera.",
        )

    if remaining_entries < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Liczba pozostałych wejść nie może być ujemna.",
        )

    if remaining_entries > total_entries:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Liczba pozostałych wejść nie może być większa "
                "od liczby wszystkich wejść."
            ),
        )

    if valid_until < valid_from:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Data końcowa karnetu nie może być wcześniejsza "
                "niż data początkowa."
            ),
        )


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
            f"{pass_obj.client.first_name} "
            f"{pass_obj.client.last_name}"
        ).strip()
        if pass_obj.client
        else None,
    )


@router.get("", response_model=list[PassRead])
def list_passes(
    current_user=Depends(require_permission("passes.view")),
    db: Session = Depends(get_db),
):
    passes = (
        db.query(Pass)
        .options(joinedload(Pass.client))
        .order_by(
            Pass.active.desc(),
            Pass.valid_until.asc(),
        )
        .all()
    )

    return [pass_to_read(item) for item in passes]


@router.get("/{pass_id}", response_model=PassRead)
def get_pass(
    pass_id: int,
    current_user=Depends(require_permission("passes.view")),
    db: Session = Depends(get_db),
):
    return pass_to_read(get_pass_or_404(db, pass_id))


@router.post("", response_model=PassRead)
def create_pass(
    payload: PassCreate,
    current_user=Depends(require_permission("passes.manage")),
    db: Session = Depends(get_db),
):
    client = db.get(Client, payload.client_id)

    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nie znaleziono klienta.",
        )

    if hasattr(client, "is_active") and not client.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Nie można dodać karnetu nieaktywnemu klientowi. "
                "Najpierw aktywuj klienta."
            ),
        )

    validate_pass_values(
        payload.total_entries,
        payload.remaining_entries,
        payload.valid_from,
        payload.valid_until,
    )

    pass_obj = Pass(**payload.model_dump())
    db.add(pass_obj)

    try:
        db.commit()
        db.refresh(pass_obj)
        return pass_to_read(get_pass_or_404(db, pass_obj.id))
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Nie udało się zapisać karnetu.",
        )


@router.put("/{pass_id}", response_model=PassRead)
def update_pass(
    pass_id: int,
    payload: PassUpdate,
    current_user=Depends(require_permission("passes.manage")),
    db: Session = Depends(get_db),
):
    pass_obj = get_pass_or_404(db, pass_id)
    values = payload.model_dump(exclude_unset=True)

    if "client_id" in values:
        client = db.get(Client, values["client_id"])

        if client is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nie znaleziono klienta.",
            )

    total_entries = values.get(
        "total_entries",
        pass_obj.total_entries,
    )
    remaining_entries = values.get(
        "remaining_entries",
        pass_obj.remaining_entries,
    )
    valid_from = values.get(
        "valid_from",
        pass_obj.valid_from,
    )
    valid_until = values.get(
        "valid_until",
        pass_obj.valid_until,
    )

    validate_pass_values(
        total_entries,
        remaining_entries,
        valid_from,
        valid_until,
    )

    for key, value in values.items():
        setattr(pass_obj, key, value)

    try:
        db.commit()
        db.refresh(pass_obj)
        return pass_to_read(get_pass_or_404(db, pass_id))
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Nie udało się zapisać zmian karnetu.",
        )


@router.delete(
    "/{pass_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_pass(
    pass_id: int,
    current_user=Depends(require_permission("passes.manage")),
    db: Session = Depends(get_db),
):
    pass_obj = get_pass_or_404(db, pass_id)

    try:
        db.delete(pass_obj)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Nie można usunąć karnetu, ponieważ posiada historię "
                "wykorzystania lub powiązane jazdy. "
                "Zamiast tego ustaw karnet jako nieaktywny."
            ),
        )