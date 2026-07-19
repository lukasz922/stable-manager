from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.client import Client
from app.models.horse import Horse
from app.models.instructor import Instructor
from app.models.client_pass import Pass
from app.models.ride import Ride


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


def get_period_start(period: str) -> datetime:
    now = datetime.now()

    if period == "today":
        return now.replace(hour=0, minute=0, second=0, microsecond=0)

    if period == "week":
        start = now - timedelta(days=now.weekday())
        return start.replace(hour=0, minute=0, second=0, microsecond=0)

    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


@router.get("/summary")
def reports_summary(db: Session = Depends(get_db)):
    now = datetime.now()

    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow_start = today_start + timedelta(days=1)

    week_start = (
        now - timedelta(days=now.weekday())
    ).replace(hour=0, minute=0, second=0, microsecond=0)

    month_start = now.replace(
        day=1,
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )

    rides_today = (
        db.query(func.count(Ride.id))
        .filter(
            Ride.start_time >= today_start,
            Ride.start_time < tomorrow_start,
        )
        .scalar()
        or 0
    )

    rides_week = (
        db.query(func.count(Ride.id))
        .filter(Ride.start_time >= week_start)
        .scalar()
        or 0
    )

    rides_month = (
        db.query(func.count(Ride.id))
        .filter(Ride.start_time >= month_start)
        .scalar()
        or 0
    )

    active_clients = db.query(func.count(Client.id)).scalar() or 0

    active_horses = (
        db.query(func.count(Horse.id))
        .filter(Horse.status == "active")
        .scalar()
        or 0
    )

    active_instructors = (
        db.query(func.count(Instructor.id))
        .filter(Instructor.status == "active")
        .scalar()
        or 0
    )

    active_passes = (
        db.query(func.count(Pass.id))
        .filter(Pass.active.is_(True))
        .scalar()
        or 0
    )

    expiring_limit = now + timedelta(days=7)

    expiring_passes = (
        db.query(func.count(Pass.id))
        .filter(
            Pass.active.is_(True),
            Pass.valid_until.is_not(None),
            Pass.valid_until >= now,
            Pass.valid_until <= expiring_limit,
        )
        .scalar()
        or 0
    )

    return {
        "rides_today": rides_today,
        "rides_week": rides_week,
        "rides_month": rides_month,
        "active_clients": active_clients,
        "active_horses": active_horses,
        "active_instructors": active_instructors,
        "active_passes": active_passes,
        "expiring_passes": expiring_passes,
    }


@router.get("/horses")
def horses_report(
    period: str = Query("month", pattern="^(today|week|month)$"),
    db: Session = Depends(get_db),
):
    start_date = get_period_start(period)

    rows = (
        db.query(
            Horse.id.label("horse_id"),
            Horse.name.label("horse_name"),
            func.count(Ride.id).label("rides"),
        )
        .join(Ride, Ride.horse_id == Horse.id)
        .filter(Ride.start_time >= start_date)
        .group_by(Horse.id, Horse.name)
        .order_by(func.count(Ride.id).desc())
        .all()
    )

    return [
        {
            "horse_id": row.horse_id,
            "horse_name": row.horse_name,
            "rides": row.rides,
        }
        for row in rows
    ]


@router.get("/instructors")
def instructors_report(
    period: str = Query("month", pattern="^(today|week|month)$"),
    db: Session = Depends(get_db),
):
    start_date = get_period_start(period)

    rows = (
        db.query(
            Instructor.id.label("instructor_id"),
            Instructor.first_name,
            Instructor.last_name,
            func.count(Ride.id).label("rides"),
        )
        .join(Ride, Ride.instructor_id == Instructor.id)
        .filter(Ride.start_time >= start_date)
        .group_by(
            Instructor.id,
            Instructor.first_name,
            Instructor.last_name,
        )
        .order_by(func.count(Ride.id).desc())
        .all()
    )

    return [
        {
            "instructor_id": row.instructor_id,
            "instructor_name": f"{row.first_name} {row.last_name}",
            "rides": row.rides,
        }
        for row in rows
    ]


@router.get("/clients")
def clients_report(
    period: str = Query("month", pattern="^(today|week|month)$"),
    db: Session = Depends(get_db),
):
    start_date = get_period_start(period)

    rows = (
        db.query(
            Client.id.label("client_id"),
            Client.first_name,
            Client.last_name,
            func.count(Ride.id).label("rides"),
        )
        .join(Ride, Ride.client_id == Client.id)
        .filter(Ride.start_time >= start_date)
        .group_by(
            Client.id,
            Client.first_name,
            Client.last_name,
        )
        .order_by(func.count(Ride.id).desc())
        .all()
    )

    return [
        {
            "client_id": row.client_id,
            "client_name": f"{row.first_name} {row.last_name}",
            "rides": row.rides,
        }
        for row in rows
    ]
