from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.ride import Ride

router = APIRouter(
    prefix="/reception",
    tags=["Reception"],
)


@router.get("/dashboard")
def reception_dashboard(
    db: Session = Depends(get_db),
):
    now = datetime.now()

    current_rides = (
        db.query(Ride)
        .options(
            joinedload(Ride.client),
            joinedload(Ride.horse),
            joinedload(Ride.instructor),
        )
        .filter(Ride.status == "checked_in")
        .all()
    )

    active = []

    for ride in current_rides:
        active.append(
            {
                "id": ride.id,
                "client": f"{ride.client.first_name} {ride.client.last_name}",
                "horse": ride.horse.name if ride.horse else None,
                "instructor": (
                    f"{ride.instructor.first_name} {ride.instructor.last_name}"
                    if ride.instructor
                    else None
                ),
                "start_time": ride.start_time,
                "end_time": ride.start_time + timedelta(
                    minutes=ride.duration_minutes
                ),
            }
        )

    upcoming = (
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

    next_rides = []

    for ride in upcoming:
        next_rides.append(
            {
                "id": ride.id,
                "client": f"{ride.client.first_name} {ride.client.last_name}",
                "horse": ride.horse.name if ride.horse else None,
                "instructor": (
                    f"{ride.instructor.first_name} {ride.instructor.last_name}"
                    if ride.instructor
                    else None
                ),
                "start_time": ride.start_time,
            }
        )

    return {
        "stats": {
            "current": len(active),
            "upcoming": len(next_rides),
        },
        "current_rides": active,
        "upcoming_rides": next_rides,
    }