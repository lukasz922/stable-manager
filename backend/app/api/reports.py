from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import require_permission
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


VALID_PERIODS = {"today", "week", "month"}


def get_period_bounds(period: str) -> tuple[datetime, datetime]:
    now = datetime.now()

    if period == "today":
        start = datetime.combine(now.date(), time.min)
        end = start + timedelta(days=1)
        return start, end

    if period == "week":
        week_start_date = now.date() - timedelta(days=now.weekday())
        start = datetime.combine(week_start_date, time.min)
        end = start + timedelta(days=7)
        return start, end

    start = datetime.combine(now.date().replace(day=1), time.min)

    if start.month == 12:
        next_month = start.replace(
            year=start.year + 1,
            month=1,
            day=1,
        )
    else:
        next_month = start.replace(
            month=start.month + 1,
            day=1,
        )

    return start, next_month


def ride_period_filter(period: str):
    start_date, end_date = get_period_bounds(period)

    return (
        Ride.start_time >= start_date,
        Ride.start_time < end_date,
    )


@router.get("/summary")
def reports_summary(
    period: str = Query("month", pattern="^(today|week|month)$"),
    current_user=Depends(require_permission("reports.view")),
    db: Session = Depends(get_db),
):
    start_date, end_date = get_period_bounds(period)
    today = date.today()

    status_rows = (
        db.query(
            Ride.status,
            func.count(Ride.id),
        )
        .filter(
            Ride.start_time >= start_date,
            Ride.start_time < end_date,
        )
        .group_by(Ride.status)
        .all()
    )

    status_counts = {
        status_name: count
        for status_name, count in status_rows
    }

    total_rides = sum(status_counts.values())
    planned_rides = status_counts.get("planned", 0)
    checked_in_rides = status_counts.get("checked_in", 0)
    completed_rides = status_counts.get("completed", 0)
    cancelled_rides = status_counts.get("cancelled", 0)

    active_clients = (
        db.query(func.count(func.distinct(Ride.client_id)))
        .filter(
            Ride.start_time >= start_date,
            Ride.start_time < end_date,
            Ride.status != "cancelled",
        )
        .scalar()
        or 0
    )

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
        .filter(
            Pass.active.is_(True),
            Pass.remaining_entries > 0,
            Pass.valid_from <= today,
            Pass.valid_until >= today,
        )
        .scalar()
        or 0
    )

    expiring_limit = today + timedelta(days=7)

    expiring_passes = (
        db.query(func.count(Pass.id))
        .filter(
            Pass.active.is_(True),
            Pass.remaining_entries > 0,
            Pass.valid_until >= today,
            Pass.valid_until <= expiring_limit,
        )
        .scalar()
        or 0
    )

    return {
        "period": period,
        "total_rides": total_rides,
        "planned_rides": planned_rides,
        "checked_in_rides": checked_in_rides,
        "completed_rides": completed_rides,
        "cancelled_rides": cancelled_rides,
        "active_clients": active_clients,
        "active_horses": active_horses,
        "active_instructors": active_instructors,
        "active_passes": active_passes,
        "expiring_passes": expiring_passes,
    }


@router.get("/horses")
def horses_report(
    period: str = Query("month", pattern="^(today|week|month)$"),
    current_user=Depends(require_permission("reports.view")),
    db: Session = Depends(get_db),
):
    start_date, end_date = get_period_bounds(period)

    rows = (
        db.query(
            Horse.id.label("horse_id"),
            Horse.name.label("horse_name"),
            func.count(Ride.id).label("rides"),
        )
        .join(Ride, Ride.horse_id == Horse.id)
        .filter(
            Ride.start_time >= start_date,
            Ride.start_time < end_date,
            Ride.status != "cancelled",
        )
        .group_by(Horse.id, Horse.name)
        .order_by(
            func.count(Ride.id).desc(),
            Horse.name.asc(),
        )
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
    current_user=Depends(require_permission("reports.view")),
    db: Session = Depends(get_db),
):
    start_date, end_date = get_period_bounds(period)

    rows = (
        db.query(
            Instructor.id.label("instructor_id"),
            Instructor.first_name,
            Instructor.last_name,
            func.count(Ride.id).label("rides"),
        )
        .join(Ride, Ride.instructor_id == Instructor.id)
        .filter(
            Ride.start_time >= start_date,
            Ride.start_time < end_date,
            Ride.status != "cancelled",
        )
        .group_by(
            Instructor.id,
            Instructor.first_name,
            Instructor.last_name,
        )
        .order_by(
            func.count(Ride.id).desc(),
            Instructor.last_name.asc(),
            Instructor.first_name.asc(),
        )
        .all()
    )

    return [
        {
            "instructor_id": row.instructor_id,
            "instructor_name": (
                f"{row.first_name} {row.last_name}"
            ).strip(),
            "rides": row.rides,
        }
        for row in rows
    ]


@router.get("/clients")
def clients_report(
    period: str = Query("month", pattern="^(today|week|month)$"),
    current_user=Depends(require_permission("reports.view")),
    db: Session = Depends(get_db),
):
    start_date, end_date = get_period_bounds(period)

    rows = (
        db.query(
            Client.id.label("client_id"),
            Client.first_name,
            Client.last_name,
            func.count(Ride.id).label("rides"),
        )
        .join(Ride, Ride.client_id == Client.id)
        .filter(
            Ride.start_time >= start_date,
            Ride.start_time < end_date,
            Ride.status != "cancelled",
        )
        .group_by(
            Client.id,
            Client.first_name,
            Client.last_name,
        )
        .order_by(
            func.count(Ride.id).desc(),
            Client.last_name.asc(),
            Client.first_name.asc(),
        )
        .all()
    )

    return [
        {
            "client_id": row.client_id,
            "client_name": (
                f"{row.first_name} {row.last_name}"
            ).strip(),
            "rides": row.rides,
        }
        for row in rows
    ]