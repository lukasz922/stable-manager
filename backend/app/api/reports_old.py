from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import Query

from app.db.session import get_db
from app.models.client import Client
from app.models.client_pass import Pass
from app.models.horse import Horse
from app.models.instructor import Instructor
from app.models.ride import Ride

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)

def get_period_filter(period: str):
    now = datetime.now()

    if period == "today":
        return now.replace(hour=0, minute=0, second=0, microsecond=0)

    if period == "week":
        start = now - timedelta(days=now.weekday())
        return start.replace(hour=0, minute=0, second=0, microsecond=0)

    if period == "month":
        return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    return None


@router.get("/instructors")
def instructors_report(db: Session = Depends(get_db)):
    rows = (
        db.query(
            Instructor.id.label("instructor_id"),
            Instructor.first_name,
            Instructor.last_name,
            func.count(Ride.id).label("rides"),
        )
        .join(Ride, Ride.instructor_id == Instructor.id)
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
def clients_report(db: Session = Depends(get_db)):
    rows = (
        db.query(
            Client.id.label("client_id"),
            Client.first_name,
            Client.last_name,
            func.count(Ride.id).label("rides"),
        )
        .join(Ride, Ride.client_id == Client.id)
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

@router.get("/horses")
def horses_report(db: Session = Depends(get_db)):
    rows = (
        db.query(
            Horse.id.label("horse_id"),
            Horse.name.label("horse_name"),
            func.count(Ride.id).label("rides"),
        )
        .join(Ride, Ride.horse_id == Horse.id)
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

@router.get("/summary")
def reports_summary(
    period: str = Query("month"),
    db: Session = Depends(get_db),
):
    start_date = get_period_filter(period)
    today = date.today()

    today_start = datetime.combine(today, datetime.min.time())
    tomorrow_start = today_start + timedelta(days=1)

    week_start = today - timedelta(days=today.weekday())
    week_start_dt = datetime.combine(week_start, datetime.min.time())

    month_start = today.replace(day=1)
    month_start_dt = datetime.combine(month_start, datetime.min.time())

period_start = get_period_filter(period)

period_rides_query = db.query(func.count(Ride.id))

if period_start is not None:
    period_rides_query = period_rides_query.filter(
        Ride.start_time >= period_start
    )

rides_period = period_rides_query.scalar() or 0

    rides_today = (
        db.query(func.count(Ride.id))
        .filter(
            Ride.start_time >= today_start,
            Ride.start_time < tomorrow_start,
        )
        .scalar()
    )

    rides_week = (
        db.query(func.count(Ride.id))
        .filter(Ride.start_time >= week_start_dt)
        .scalar()
    )

    rides_month = (
        db.query(func.count(Ride.id))
        .filter(Ride.start_time >= month_start_dt)
        .scalar()
    )

    active_clients = db.query(func.count(Client.id)).scalar()

    active_horses = (
        db.query(func.count(Horse.id))
        .filter(Horse.status == "available")
        .scalar()
    )

    active_instructors = (
        db.query(func.count(Instructor.id))
        .filter(Instructor.status == "active")
        .scalar()
    )

    active_passes = (
        db.query(func.count(Pass.id))
        .filter(
            Pass.active == True,
            Pass.remaining_entries > 0,
            Pass.valid_until >= today,
        )
        .scalar()
    )

    expiring_passes = (
        db.query(func.count(Pass.id))
        .filter(
            Pass.active == True,
            Pass.valid_until >= today,
            Pass.valid_until <= today + timedelta(days=7),
        )
        .scalar()
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
    
    