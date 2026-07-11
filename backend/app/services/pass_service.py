from app.models.pass_history import PassHistory
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.client_pass import Pass
from app.models.ride import Ride


def find_available_pass(
    db: Session,
    client_id: int,
    ride_start_time: datetime,
) -> Pass | None:
    ride_date = ride_start_time.date()

    return (
        db.query(Pass)
        .filter(
            Pass.client_id == client_id,
            Pass.active.is_(True),
            Pass.remaining_entries > 0,
            Pass.valid_from <= ride_date,
            Pass.valid_until >= ride_date,
        )
        .order_by(
            Pass.valid_until.asc(),
            Pass.id.asc(),
        )
        .first()
    )


def deduct_pass_entry(
    db: Session,
    ride: Ride,
) -> None:
    if ride.pass_entry_deducted:
        return

    client_pass = find_available_pass(
        db=db,
        client_id=ride.client_id,
        ride_start_time=ride.start_time,
    )

    if client_pass is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Klient nie ma aktywnego karnetu z dostępnymi "
                "wejściami na dzień tej jazdy."
            ),
        )

    client_pass.remaining_entries -= 1
ride.pass_entry_deducted = True

history = PassHistory(
    pass_id=client_pass.id,
    ride_id=ride.id,
    operation="DEDUCT",
    entries=1,
    note="Odliczono wejście po oznaczeniu jazdy jako odbytej.",
)

db.add(history)

if client_pass.remaining_entries <= 0:
    client_pass.remaining_entries = 0
    client_pass.active = False


def restore_pass_entry(
    db: Session,
    ride: Ride,
) -> None:
    if not ride.pass_entry_deducted:
        return

    ride_date = ride.start_time.date()

    client_pass = (
        db.query(Pass)
        .filter(
            Pass.client_id == ride.client_id,
            Pass.valid_from <= ride_date,
            Pass.valid_until >= ride_date,
        )
        .order_by(
            Pass.valid_until.asc(),
            Pass.id.asc(),
        )
        .first()
    )

    if client_pass is not None:
        client_pass.remaining_entries = min(
            client_pass.remaining_entries + 1,
            client_pass.total_entries,
        )
      history = PassHistory(
        pass_id=client_pass.id,
        ride_id=ride.id,
        operation="RESTORE",
        entries=1,
        note="Zwrócono wejście po cofnięciu statusu jazdy.",
    )

    db.add(history)
        if client_pass.remaining_entries > 0:
            client_pass.active = True

    ride.pass_entry_deducted = False


def apply_pass_status_change(
    db: Session,
    ride: Ride,
    old_status: str | None,
    new_status: str,
) -> None:
    if new_status == "completed" and old_status != "completed":
        deduct_pass_entry(db, ride)

    elif old_status == "completed" and new_status != "completed":
        restore_pass_entry(db, ride)