from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import require_permission
from app.db.session import get_db
from app.models.client import Client
from app.schemas.client import ClientCreate, ClientResponse, ClientUpdate


router = APIRouter(prefix="/clients", tags=["Clients"])


def get_client_or_404(db: Session, client_id: int) -> Client:
    client = db.query(Client).filter(Client.id == client_id).first()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nie znaleziono klienta.",
        )

    return client


@router.get("", response_model=list[ClientResponse])
def list_clients(
    client_status: str = Query(
        default="all",
        alias="status",
        pattern="^(active|inactive|all)$",
    ),
    current_user=Depends(require_permission("clients.view")),
    db: Session = Depends(get_db),
):
    query = db.query(Client)

    if client_status == "active":
        query = query.filter(Client.is_active.is_(True))
    elif client_status == "inactive":
        query = query.filter(Client.is_active.is_(False))

    return query.order_by(
        Client.last_name.asc(),
        Client.first_name.asc(),
    ).all()


@router.post("", response_model=ClientResponse)
def create_client(
    payload: ClientCreate,
    current_user=Depends(require_permission("clients.manage")),
    db: Session = Depends(get_db),
):
    client = Client(**payload.model_dump(), is_active=True)
    db.add(client)

    try:
        db.commit()
        db.refresh(client)
        return client
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Nie można zapisać klienta. Kod RFID, QR lub kod "
                "kreskowy jest już przypisany do innego klienta."
            ),
        )


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: int,
    current_user=Depends(require_permission("clients.view")),
    db: Session = Depends(get_db),
):
    return get_client_or_404(db, client_id)


@router.patch("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: int,
    payload: ClientUpdate,
    current_user=Depends(require_permission("clients.manage")),
    db: Session = Depends(get_db),
):
    client = get_client_or_404(db, client_id)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(client, field, value)

    try:
        db.commit()
        db.refresh(client)
        return client
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Nie można zapisać zmian. Kod RFID, QR lub kod "
                "kreskowy jest już przypisany do innego klienta."
            ),
        )


@router.post("/{client_id}/deactivate", response_model=ClientResponse)
def deactivate_client(
    client_id: int,
    current_user=Depends(require_permission("clients.manage")),
    db: Session = Depends(get_db),
):
    client = get_client_or_404(db, client_id)

    if not client.is_active:
        return client

    client.is_active = False
    db.commit()
    db.refresh(client)
    return client


@router.post("/{client_id}/activate", response_model=ClientResponse)
def activate_client(
    client_id: int,
    current_user=Depends(require_permission("clients.manage")),
    db: Session = Depends(get_db),
):
    client = get_client_or_404(db, client_id)

    if client.is_active:
        return client

    client.is_active = True
    db.commit()
    db.refresh(client)
    return client


@router.delete(
    "/{client_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_client(
    client_id: int,
    current_user=Depends(require_permission("clients.manage")),
    db: Session = Depends(get_db),
):
    client = get_client_or_404(db, client_id)

    try:
        db.delete(client)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Nie można trwale usunąć klienta, ponieważ posiada "
                "powiązane jazdy, karnety lub historię. "
                "Zamiast tego użyj opcji „Dezaktywuj klienta”."
            ),
        )