from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.client_pass import Pass
from app.models.pass_history import PassHistory
from app.models.ride import Ride


def find_available_pass(
    db: Session,
    client_id: int,
    ride_start_time: datetime,
) -> Pass | None:
    """
    Zwraca aktywny karnet klienta, który:
    - ma dostępne wejścia,
    - jest ważny w dniu jazdy.

    Jeśli klient ma kilka karnetów, używany jest ten,
    który wygasa najwcześniej.
    """
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


def save_pass_history(
    db: Session,
    pass_id: int,
    ride_id: int | None,
    operation: str,
    note: str,
    entries: int = 1,
) -> None:
    """
    Zapisuje operację wykorzystania lub zwrotu wejścia.
    """
    history = PassHistory(
        pass_id=pass_id,
        ride_id=ride_id,
        operation=operation,
        entries=entries,
        note=note,
    )

    db.add(history)


def find_pass_used_for_ride(
    db: Session,
    ride: Ride,
) -> Pass | None:
    """
    Szuka karnetu, z którego ostatnio odjęto wejście
    dla podanej jazdy.
    """
    last_history = (
        db.query(PassHistory)
        .filter(PassHistory.ride_id == ride.id)
        .order_by(
            PassHistory.created_at.desc(),
            PassHistory.id.desc(),
        )
        .first()
    )

    if last_history and last_history.operation == "DEDUCT":
        return db.get(Pass, last_history.pass_id)

    return None


def deduct_pass_entry(
    db: Session,
    ride: Ride,
) -> None:
    """
    Odejmuje jedno wejście z karnetu.

    Funkcja nie odejmie wejścia drugi raz, jeśli jazda
    została już rozliczona.
    """
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

    if client_pass.remaining_entries <= 0:
        client_pass.remaining_entries = 0
        client_pass.active = False

    save_pass_history(
        db=db,
        pass_id=client_pass.id,
        ride_id=ride.id,
        operation="DEDUCT",
        entries=1,
        note="Odliczono wejście po oznaczeniu jazdy jako odbytej.",
    )


def restore_pass_entry(
    db: Session,
    ride: Ride,
) -> None:
    """
    Zwraca jedno wejście do karnetu po cofnięciu statusu
    jazdy z completed na inny status.
    """
    if not ride.pass_entry_deducted:
        return

    client_pass = find_pass_used_for_ride(db, ride)

    if client_pass is None:
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

    if client_pass is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Nie znaleziono karnetu, do którego można "
                "zwrócić wykorzystane wejście."
            ),
        )

    client_pass.remaining_entries = min(
        client_pass.remaining_entries + 1,
        client_pass.total_entries,
    )

    if client_pass.remaining_entries > 0:
        client_pass.active = True

    ride.pass_entry_deducted = False

    save_pass_history(
        db=db,
        pass_id=client_pass.id,
        ride_id=ride.id,
        operation="RESTORE",
        entries=1,
        note="Zwrócono wejście po cofnięciu statusu jazdy.",
    )


def apply_pass_status_change(
    db: Session,
    ride: Ride,
    old_status: str | None,
    new_status: str,
) -> None:
    """
    Obsługuje zmianę statusu jazdy:

    planned/cancelled -> completed:
        odejmuje wejście;

    completed -> planned/cancelled:
        zwraca wejście.
    """
    if new_status == "completed" and old_status != "completed":
        deduct_pass_entry(db, ride)

    elif old_status == "completed" and new_status != "completed":
        restore_pass_entry(db, ride)