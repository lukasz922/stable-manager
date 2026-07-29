from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.core.dependencies import require_permission
from app.models.instructor_schedule import InstructorSchedule, ScheduleStatus
from app.models.ride import Ride
from app.schemas.ride import (
    RideCreate,
    RideRead,
    RideStatusUpdate,
)
from app.services.pass_service import apply_pass_status_change

router = APIRouter(prefix="/rides", tags=["Rides"])


def ride_to_read(ride: Ride) -> RideRead:
    return RideRead(
        id=ride.id,
        client_id=ride.client_id,
        horse_id=ride.horse_id,
        instructor_id=ride.instructor_id,
        pass_id=ride.pass_id,
        start_time=ride.start_time,
        duration_minutes=ride.duration_minutes,
        ride_type=ride.ride_type,
        status=ride.status,
        notes=ride.notes,
        client_name=(
            f"{ride.client.first_name} {ride.client.last_name}"
            if ride.client
            else None
        ),
        horse_name=ride.horse.name if ride.horse else None,
        instructor_name=(
            f"{ride.instructor.first_name} {ride.instructor.last_name}"
            if ride.instructor
            else None
        ),
    )

def get_ride_with_relations(
    db: Session,
    ride_id: int,
) -> Ride | None:
    return (
        db.query(Ride)
        .options(
            joinedload(Ride.client),
            joinedload(Ride.horse),
            joinedload(Ride.instructor),
        )
        .filter(Ride.id == ride_id)
        .first()
    )



def validate_selected_pass(
    db: Session,
    client_id: int,
    pass_id: int | None,
    ride_start_time: datetime,
) -> None:
    if pass_id is None:
        return

    from app.models.client_pass import Pass

    client_pass = db.get(Pass, pass_id)

    if client_pass is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wybrany karnet nie istnieje.",
        )

    if client_pass.client_id != client_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Wybrany karnet nie należy do klienta tej jazdy.",
        )

    ride_date = ride_start_time.date()

    if not (
        client_pass.valid_from <= ride_date
        <= client_pass.valid_until
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Wybrany karnet nie jest ważny w dniu tej jazdy.",
        )

def check_instructor_schedule(
    db: Session,
    payload: RideCreate,
) -> None:
    if payload.status == "cancelled":
        return

    ride_start = payload.start_time
    ride_end = ride_start + timedelta(
        minutes=payload.duration_minutes
    )

    schedule = (
        db.query(InstructorSchedule)
        .filter(
            InstructorSchedule.instructor_id == payload.instructor_id,
            InstructorSchedule.date == ride_start.date(),
        )
        .first()
    )

    if schedule is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Instruktor nie ma ustalonego grafiku "
                "na dzień tej jazdy."
            ),
        )

    schedule_status = (
        schedule.status.value
        if isinstance(schedule.status, ScheduleStatus)
        else str(schedule.status)
    )

    if schedule_status != ScheduleStatus.WORK.value:
        status_labels = {
            ScheduleStatus.OFF.value: "wolne",
            ScheduleStatus.VACATION.value: "urlop",
            ScheduleStatus.SICK.value: "chorobowe",
            ScheduleStatus.TRAINING.value: "szkolenie",
        }

        status_label = status_labels.get(
            schedule_status,
            schedule_status,
        )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Instruktor nie może prowadzić jazdy w tym dniu. "
                f"Status grafiku: {status_label}."
            ),
        )

    required_times = (
        schedule.start_time,
        schedule.end_time,
        schedule.availability_start_time,
        schedule.availability_end_time,
    )

    if any(value is None for value in required_times):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Grafik instruktora nie zawiera kompletnych "
                "godzin pracy i dyspozycyjności."
            ),
        )

    work_start = datetime.combine(
        ride_start.date(),
        schedule.start_time,
    )
    work_end = datetime.combine(
        ride_start.date(),
        schedule.end_time,
    )
    availability_start = datetime.combine(
        ride_start.date(),
        schedule.availability_start_time,
    )
    availability_end = datetime.combine(
        ride_start.date(),
        schedule.availability_end_time,
    )

    if ride_start < work_start or ride_end > work_end:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Jazda nie mieści się w godzinach pracy "
                "instruktora."
            ),
        )

    if (
        ride_start < availability_start
        or ride_end > availability_end
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Jazda nie mieści się w godzinach "
                "dyspozycyjności instruktora."
            ),
        )


def check_ride_conflicts(
    db: Session,
    payload: RideCreate,
    excluded_ride_id: int | None = None,
) -> None:
    if payload.status == "cancelled":
        return

    new_start = payload.start_time
    new_end = new_start + timedelta(
        minutes=payload.duration_minutes
    )

    query = (
        db.query(Ride)
        .options(
            joinedload(Ride.horse),
            joinedload(Ride.instructor),
        )
        .filter(
            Ride.status != "cancelled",
            or_(
                Ride.horse_id == payload.horse_id,
                Ride.instructor_id == payload.instructor_id,
            ),
        )
    )

    if excluded_ride_id is not None:
        query = query.filter(Ride.id != excluded_ride_id)

    for existing_ride in query.all():
        existing_start = existing_ride.start_time
        existing_end = existing_start + timedelta(
            minutes=existing_ride.duration_minutes
        )

        overlaps = (
            new_start < existing_end
            and new_end > existing_start
        )

        if not overlaps:
            continue

        if existing_ride.horse_id == payload.horse_id:
            horse_name = (
                existing_ride.horse.name
                if existing_ride.horse
                else f"ID {payload.horse_id}"
            )

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f'Koń „{horse_name}” ma już zaplanowaną '
                    "jazdę w tym czasie."
                ),
            )

        if existing_ride.instructor_id == payload.instructor_id:
            instructor_name = (
                f"{existing_ride.instructor.first_name} "
                f"{existing_ride.instructor.last_name}"
                if existing_ride.instructor
                else f"ID {payload.instructor_id}"
            )

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f'Instruktor „{instructor_name}” prowadzi '
                    "już inną jazdę w tym czasie."
                ),
            )
def update_finished_rides(db: Session) -> None:
    now = datetime.now()

    rides = (
        db.query(Ride)
        .filter(Ride.status == "checked_in")
        .all()
    )

    changed = False

    for ride in rides:
        end_time = ride.start_time + timedelta(
            minutes=ride.duration_minutes
        )

        if end_time > now:
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

@router.get("", response_model=list[RideRead])
def list_rides(
    current_user=Depends(require_permission("calendar.view")),
    db: Session = Depends(get_db),
):
    update_finished_rides(db)
    rides = (
        db.query(Ride)
        .options(
            joinedload(Ride.client),
            joinedload(Ride.horse),
            joinedload(Ride.instructor),
        )
        .order_by(Ride.start_time.asc())
        .all()
    )

    return [ride_to_read(ride) for ride in rides]


@router.post("", response_model=RideRead)
def create_ride(
    payload: RideCreate,
    current_user=Depends(require_permission("calendar.manage")),
    db: Session = Depends(get_db),
):
    validate_selected_pass(
        db,
        payload.client_id,
        payload.pass_id,
        payload.start_time,
    )
    check_instructor_schedule(db, payload)
    check_ride_conflicts(db, payload)

    ride = Ride(**payload.model_dump())
    ride.pass_entry_deducted = False

    db.add(ride)
    db.flush()

    apply_pass_status_change(
        db=db,
        ride=ride,
        old_status=None,
        new_status=payload.status,
    )

    db.commit()
    db.refresh(ride)

    saved_ride = get_ride_with_relations(db, ride.id)

    if saved_ride is None:
        raise HTTPException(
            status_code=500,
            detail="Nie udało się odczytać zapisanej jazdy.",
        )

    return ride_to_read(saved_ride)

@router.get("/client/{client_id}", response_model=list[RideRead])
def list_client_rides(
    client_id: int,
    current_user=Depends(require_permission("calendar.view")),
    db: Session = Depends(get_db),
):
    rides = (
        db.query(Ride)
        .options(
            joinedload(Ride.client),
            joinedload(Ride.horse),
            joinedload(Ride.instructor),
        )
        .filter(Ride.client_id == client_id)
        .order_by(Ride.start_time.desc())
        .all()
    )

    return [ride_to_read(ride) for ride in rides]

@router.get("/{ride_id}", response_model=RideRead)
def get_ride(
    ride_id: int,
    current_user=Depends(require_permission("calendar.view")),
    db: Session = Depends(get_db),
):
    ride = get_ride_with_relations(db, ride_id)

    if ride is None:
        raise HTTPException(
            status_code=404,
            detail="Nie znaleziono jazdy.",
        )

    return ride_to_read(ride)


@router.put("/{ride_id}", response_model=RideRead)
def update_ride(
    ride_id: int,
    payload: RideCreate,
    current_user=Depends(require_permission("calendar.manage")),
    db: Session = Depends(get_db),
):
    ride = db.get(Ride, ride_id)

    if ride is None:
        raise HTTPException(
            status_code=404,
            detail="Nie znaleziono jazdy.",
        )

    effective_pass_id = (
        payload.pass_id
        if payload.pass_id is not None
        else ride.pass_id
    )

    protected_data_changed = (
        payload.client_id != ride.client_id
        or payload.start_time != ride.start_time
        or effective_pass_id != ride.pass_id
    )

    if ride.status == "completed" and protected_data_changed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Nie można zmienić klienta, terminu ani karnetu "
                "rozliczonej jazdy. Najpierw cofnij status "
                "jazdy z „Zakończona”."
            ),
        )

    validate_selected_pass(
        db,
        payload.client_id,
        payload.pass_id,
        payload.start_time,
    )
    check_instructor_schedule(db, payload)
    check_ride_conflicts(
        db=db,
        payload=payload,
        excluded_ride_id=ride_id,
    )

    old_status = ride.status

    for key, value in payload.model_dump().items():
        if key == "pass_id" and value is None:
            continue

        setattr(ride, key, value)

    apply_pass_status_change(
        db=db,
        ride=ride,
        old_status=old_status,
        new_status=payload.status,
    )

    db.commit()

    updated_ride = get_ride_with_relations(db, ride_id)

    if updated_ride is None:
        raise HTTPException(
            status_code=500,
            detail="Nie udało się odczytać zaktualizowanej jazdy.",
        )

    return ride_to_read(updated_ride)

@router.patch("/{ride_id}/status", response_model=RideRead)
def update_ride_status(
    ride_id: int,
    payload: RideStatusUpdate,
    current_user=Depends(require_permission("calendar.manage")),
    db: Session = Depends(get_db),
):
    ride = db.get(Ride, ride_id)

    if ride is None:
        raise HTTPException(
            status_code=404,
            detail="Nie znaleziono jazdy.",
        )

    old_status = ride.status
    ride.status = payload.status

    apply_pass_status_change(
        db=db,
        ride=ride,
        old_status=old_status,
        new_status=payload.status,
    )

    db.commit()

    updated_ride = get_ride_with_relations(db, ride_id)

    if updated_ride is None:
        raise HTTPException(
            status_code=500,
            detail="Nie udało się odczytać jazdy.",
        )

    return ride_to_read(updated_ride)

@router.delete(
    "/{ride_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_ride(
    ride_id: int,
    current_user=Depends(require_permission("calendar.manage")),
    db: Session = Depends(get_db),
):
    ride = db.get(Ride, ride_id)

    if ride is None:
        raise HTTPException(
            status_code=404,
            detail="Nie znaleziono jazdy.",
        )

    if ride.status == "completed":
        apply_pass_status_change(
            db=db,
            ride=ride,
            old_status="completed",
            new_status="planned",
        )

    db.delete(ride)
    db.commit()