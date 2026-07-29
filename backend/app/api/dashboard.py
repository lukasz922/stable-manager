from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import require_permission
from app.db.session import get_db
from app.models.client import Client
from app.models.client_pass import Pass
from app.models.horse import Horse
from app.models.ride import Ride


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/stats")
def get_dashboard_stats(
    current_user=Depends(require_permission("dashboard.view")),
    db: Session = Depends(get_db),
):
    now = datetime.now()
    today = now.date()

    day_start = datetime.combine(today, time.min)
    day_end = day_start + timedelta(days=1)
    next_hour = now + timedelta(hours=1)

    clients_count = db.query(Client).count()

    horses_count = (
        db.query(Horse)
        .filter(Horse.status == "active")
        .count()
    )

    today_query = db.query(Ride).filter(
        Ride.start_time >= day_start,
        Ride.start_time < day_end,
    )

    rides_today = today_query.count()

    checked_in_today = today_query.filter(
        Ride.status == "checked_in",
    ).count()

    completed_today = today_query.filter(
        Ride.status == "completed",
    ).count()

    planned_today = today_query.filter(
        Ride.status == "planned",
    ).count()

    cancelled_today = today_query.filter(
        Ride.status == "cancelled",
    ).count()

    rides_next_hour = (
        db.query(Ride)
        .filter(
            Ride.start_time >= now,
            Ride.start_time <= next_hour,
            Ride.status == "planned",
        )
        .count()
    )

    today_rides = (
        db.query(Ride)
        .options(
            joinedload(Ride.client),
            joinedload(Ride.horse),
            joinedload(Ride.instructor),
        )
        .filter(
            Ride.start_time >= day_start,
            Ride.start_time < day_end,
        )
        .order_by(Ride.start_time.asc())
        .all()
    )

    expiring_limit = today + timedelta(days=7)

    expiring_passes = (
        db.query(Pass)
        .filter(
            Pass.active.is_(True),
            Pass.remaining_entries > 0,
            Pass.valid_until >= today,
            or_(
                Pass.remaining_entries <= 1,
                Pass.valid_until <= expiring_limit,
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
        "cancelled_today": cancelled_today,
        "expiring_passes": expiring_passes,
        "rides_next_hour": rides_next_hour,
        "today_rides": [
            {
                "id": ride.id,
                "start_time": ride.start_time.isoformat(),
                "status": ride.status,
                "client": (
                    f"{ride.client.first_name} "
                    f"{ride.client.last_name}"
                ).strip()
                if ride.client
                else "-",
                "horse": ride.horse.name if ride.horse else "-",
                "instructor": (
                    f"{ride.instructor.first_name} "
                    f"{ride.instructor.last_name}"
                ).strip()
                if ride.instructor
                else "-",
            }
            for ride in today_rides
        ],
    }