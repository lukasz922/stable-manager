from datetime import datetime, time, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.client import Client
from app.models.horse import Horse
from app.models.ride import Ride
from sqlalchemy import or_

from app.models.client_pass import Pass

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
):
    today = datetime.now().date()

    day_start = datetime.combine(today, time.min)
    day_end = datetime.combine(today, time.max)

    clients_count = db.query(Client).count()
    horses_count = db.query(Horse).count()

    rides_today = (
        db.query(Ride)
        .filter(
            Ride.start_time >= day_start,
            Ride.start_time <= day_end,
        )
        .count()
    )

    checked_in_today = (
        db.query(Ride)
        .filter(
            Ride.start_time >= day_start,
            Ride.start_time <= day_end,
            Ride.status == "checked_in",
        )
        .count()
    )

    completed_today = (
        db.query(Ride)
        .filter(
            Ride.start_time >= day_start,
            Ride.start_time <= day_end,
            Ride.status == "completed",
        )
        .count()
    )

    planned_today = (
        db.query(Ride)
        .filter(
            Ride.start_time >= day_start,
            Ride.start_time <= day_end,
            Ride.status == "planned",
        )
        .count()
    )

    now = datetime.now()
    next_hour = now + timedelta(hours=1)

    rides_next_hour = (
        db.query(Ride)
        .filter(
            Ride.start_time >= now,
            Ride.start_time <= next_hour,
            Ride.status.in_(["planned", "checked_in"]),
        )
        .count()
    )
    
    today_rides = (
        db.query(Ride)
        .filter(
            Ride.start_time >= day_start,
            Ride.start_time <= day_end,
        )
        .order_by(Ride.start_time.asc())
        .limit(10)
        .all()
    )

    expiring_passes = (
        db.query(Pass)
        .filter(
            Pass.active.is_(True),
            or_(
                Pass.remaining_entries <= 1,
                Pass.valid_until <= today + timedelta(days=7),
            ),
        )
        .count()
    )
    return {
        "clients_count": clients_count,
        "horses_count": horses_count,
        "rides_today": rides_today,
        "checked_in_today": checked_in_today,
        "completed_today": completed_today,
        "planned_today": planned_today,
        "expiring_passes": expiring_passes,
        "rides_next_hour": rides_next_hour,
                "today_rides": [
    {
        "id": ride.id,
        "start_time": ride.start_time.isoformat(),
        "status": ride.status,
        "client": (
            f"{ride.client.first_name} {ride.client.last_name}"
            if ride.client
            else "-"
        ),
        "horse": ride.horse.name if ride.horse else "-",
    }
    for ride in today_rides
],
}