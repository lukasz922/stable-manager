from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import require_permission
from app.db.session import get_db
from app.models.ride import Ride
from app.services.pass_service import apply_pass_status_change


router = APIRouter(prefix="/reception", tags=["Reception"])


def complete_finished_rides(db: Session, now: datetime) -> None:
    rides = db.query(Ride).filter(Ride.status == "checked_in").all()
    changed = False

    for ride in rides:
        ride_end = ride.start_time + timedelta(
            minutes=ride.duration_minutes
        )

        if ride_end > now:
            continue

        old_status = ride.status
        ride.status = "completed"

        apply_pass_status_change(
            db=db,
            ride=ride,
            old_status=old_status,
            new_status="completed",
        )
        changed = True

    if changed:
        db.commit()


def ride_to_dict(ride: Ride) -> dict:
    return {
        "id": ride.id,
        "client": (
            f"{ride.client.first_name} {ride.client.last_name}"
        ).strip() if ride.client else "Nieznany klient",
        "horse": ride.horse.name if ride.horse else "—",
        "instructor": (
            f"{ride.instructor.first_name} "
            f"{ride.instructor.last_name}"
        ).strip() if ride.instructor else "—",
        "start_time": ride.start_time,
        "end_time": ride.start_time + timedelta(
            minutes=ride.duration_minutes
        ),
        "status": ride.status,
    }


@router.get("/dashboard")
def reception_dashboard(
    current_user=Depends(require_permission("reception.view")),
    db: Session = Depends(get_db),
):
    now = datetime.now()
    complete_finished_rides(db, now)

    current_rides = (
        db.query(Ride)
        .options(
            joinedload(Ride.client),
            joinedload(Ride.horse),
            joinedload(Ride.instructor),
        )
        .filter(Ride.status == "checked_in")
        .order_by(Ride.start_time.asc())
        .all()
    )

    active = [
        ride_to_dict(ride)
        for ride in current_rides
        if ride.start_time + timedelta(
            minutes=ride.duration_minutes
        ) > now
    ]

    upcoming_rides = (
        db.query(Ride)
        .options(
            joinedload(Ride.client),
            joinedload(Ride.horse),
            joinedload(Ride.instructor),
        )
        .filter(
            Ride.status == "planned",
            Ride.start_time >= now,
            Ride.start_time <= now + timedelta(minutes=30),
        )
        .order_by(Ride.start_time.asc())
        .all()
    )

    upcoming = [ride_to_dict(ride) for ride in upcoming_rides]

    return {
        "stats": {
            "current": len(active),
            "upcoming": len(upcoming),
        },
        "current_rides": active,
        "upcoming_rides": upcoming,
    }