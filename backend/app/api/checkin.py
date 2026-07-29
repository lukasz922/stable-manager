from datetime import datetime, timedelta

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.core.dependencies import require_permission
from app.models.client import Client
from app.models.client_pass import Pass
from app.models.ride import Ride
from app.models.horse import Horse
from app.models.instructor import Instructor

router = APIRouter(prefix="/check-in", tags=["Check-in"])


class RfidCheckInRequest(BaseModel):
    rfid_uid: str


class PassSummary(BaseModel):
    id: int
    name: str
    remaining_entries: int
    valid_until: str


class RfidCheckInResponse(BaseModel):
    mode: Literal["planned", "quick_ride"]

    client_id: int
    client_name: str

    ride_id: int | None = None
    ride_time: datetime | None = None
    ride_status: str | None = None

    horse_name: str | None = None
    instructor_name: str | None = None

    passes: list[PassSummary] = Field(default_factory=list)

class QuickRideRequest(BaseModel):
    client_id: int
    horse_id: int
    instructor_id: int
    pass_id: int
    duration_minutes: int = 60


class QuickRideResponse(BaseModel):
    ride_id: int
    status: str

def find_active_checked_in_ride(
    db: Session,
    client_id: int,
    now: datetime,
) -> Ride | None:
    """
    Zwraca trwającą jazdę klienta ze statusem checked_in.
    Jazda jest aktywna do czasu: start_time + duration_minutes.
    """
    checked_in_rides = (
        db.query(Ride)
        .filter(
            Ride.client_id == client_id,
            Ride.status == "checked_in",
        )
        .order_by(Ride.start_time.desc())
        .all()
    )

    for existing_ride in checked_in_rides:
        ride_end = existing_ride.start_time + timedelta(
            minutes=existing_ride.duration_minutes
        )

        if ride_end > now:
            return existing_ride

    return None


@router.post(
    "/rfid",
    response_model=RfidCheckInResponse,
)
def check_in_by_rfid(
    payload: RfidCheckInRequest,
    current_user=Depends(require_permission("scanner.use")),
    db: Session = Depends(get_db),
):
    rfid_uid = payload.rfid_uid.strip()

    if not rfid_uid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Kod RFID jest wymagany.",
        )

    client = (
        db.query(Client)
        .filter(Client.rfid_uid == rfid_uid)
        .first()
    )

    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Nie znaleziono klienta przypisanego "
                "do tej karty RFID."
            ),
        )

    client_name = (
        f"{client.first_name} {client.last_name}"
    ).strip()

    now = datetime.now()
    time_from = now - timedelta(hours=2)
    time_to = now + timedelta(hours=4)

    ride = (
        db.query(Ride)
        .options(
            joinedload(Ride.horse),
            joinedload(Ride.instructor),
        )
        .filter(
            Ride.client_id == client.id,
            Ride.status.in_(["planned", "checked_in"]),
            Ride.start_time >= time_from,
            Ride.start_time <= time_to,
        )
        .order_by(Ride.start_time.asc())
        .first()
    )

    # Brak jazdy w oknie czasowym. Zanim otworzymy formularz
    # szybkiej jazdy, sprawdzamy, czy klient nie ma już
    # rozpoczętej innej jazdy.
    if ride is None:
        active_ride = find_active_checked_in_ride(
            db=db,
            client_id=client.id,
            now=now,
        )

        if active_ride is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Klient ma już rozpoczętą jazdę "
                    f"(ID: {active_ride.id})."
                ),
            )

        today = now.date()

        available_passes = (
            db.query(Pass)
            .filter(
                Pass.client_id == client.id,
                Pass.active.is_(True),
                Pass.remaining_entries > 0,
                Pass.valid_from <= today,
                Pass.valid_until >= today,
            )
            .order_by(
                Pass.valid_until.asc(),
                Pass.id.asc(),
            )
            .all()
        )

        return RfidCheckInResponse(
            mode="quick_ride",
            client_id=client.id,
            client_name=client_name,
            passes=[
                PassSummary(
                    id=client_pass.id,
                    name=client_pass.name,
                    remaining_entries=(
                        client_pass.remaining_entries
                    ),
                    valid_until=(
                        client_pass.valid_until.isoformat()
                    ),
                )
                for client_pass in available_passes
            ],
        )

    # Znaleziono jazdę w oknie czasowym.
    if ride.status == "checked_in":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Ta jazda została już wcześniej odbita. "
                "Klient ma status „Obecny”."
            ),
        )

    ride.status = "checked_in"
    db.commit()
    db.refresh(ride)

    horse_name = (
        ride.horse.name
        if ride.horse
        else None
    )

    instructor_name = None

    if ride.instructor:
        instructor_name = (
            f"{ride.instructor.first_name} "
            f"{ride.instructor.last_name}"
        ).strip()

    return RfidCheckInResponse(
        mode="planned",
        client_id=client.id,
        client_name=client_name,
        ride_id=ride.id,
        ride_time=ride.start_time,
        ride_status=ride.status,
        horse_name=horse_name,
        instructor_name=instructor_name,
    )
    
@router.post(
    "/quick-ride",
    response_model=QuickRideResponse,
)
def create_quick_ride(
    payload: QuickRideRequest,
    current_user=Depends(require_permission("scanner.use")),
    db: Session = Depends(get_db),
):
    client = (
        db.query(Client)
        .filter(Client.id == payload.client_id)
        .first()
    )

    if client is None:
        raise HTTPException(
            status_code=404,
            detail="Klient nie istnieje.",
        )

    now = datetime.now()

    active_ride = find_active_checked_in_ride(
        db=db,
        client_id=client.id,
        now=now,
    )

    if active_ride is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Nie można utworzyć szybkiej jazdy. "
                "Klient ma już rozpoczętą jazdę "
                f"(ID: {active_ride.id})."
            ),
        )

    horse = (
        db.query(Horse)
        .filter(Horse.id == payload.horse_id)
        .first()
    )

    if horse is None:
        raise HTTPException(
            status_code=404,
            detail="Koń nie istnieje.",
        )

    instructor = (
        db.query(Instructor)
        .filter(Instructor.id == payload.instructor_id)
        .first()
    )

    if instructor is None:
        raise HTTPException(
            status_code=404,
            detail="Instruktor nie istnieje.",
        )

    client_pass = (
        db.query(Pass)
        .filter(Pass.id == payload.pass_id)
        .first()
    )

    if client_pass is None:
        raise HTTPException(
            status_code=404,
            detail="Wybrany karnet nie istnieje.",
        )

    if client_pass.client_id != client.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Wybrany karnet nie należy do tego klienta.",
        )

    today = now.date()

    if not client_pass.active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Wybrany karnet jest nieaktywny.",
        )

    if client_pass.remaining_entries <= 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Wybrany karnet nie ma dostępnych wejść.",
        )

    if not (
        client_pass.valid_from <= today
        <= client_pass.valid_until
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Wybrany karnet nie jest obecnie ważny.",
        )

    ride = Ride(
        client_id=payload.client_id,
        horse_id=payload.horse_id,
        instructor_id=payload.instructor_id,
        pass_id=payload.pass_id,
        start_time=now,
        duration_minutes=payload.duration_minutes,
        ride_type="individual",
        status="checked_in",
        pass_entry_deducted=False,
    )

    db.add(ride)
    db.commit()
    db.refresh(ride)

    return QuickRideResponse(
        ride_id=ride.id,
        status=ride.status,
    )