from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.ride import Ride
from app.schemas.ride import RideCreate, RideRead
from app.services.pass_service import apply_pass_status_change

router = APIRouter(prefix="/rides", tags=["Rides"])


def ride_to_read(ride: Ride) -> RideRead:
    return RideRead(
        id=ride.id,
        client_id=ride.client_id,
        horse_id=ride.horse_id,
        instructor_id=ride.instructor_id,
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


@router.get("", response_model=list[RideRead])
def list_rides(db: Session = Depends(get_db)):
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
    db: Session = Depends(get_db),
):
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


@router.get("/{ride_id}", response_model=RideRead)
def get_ride(
    ride_id: int,
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
    db: Session = Depends(get_db),
):
    ride = db.get(Ride, ride_id)

    if ride is None:
        raise HTTPException(
            status_code=404,
            detail="Nie znaleziono jazdy.",
        )

    check_ride_conflicts(
        db=db,
        payload=payload,
        excluded_ride_id=ride_id,
    )

    old_status = ride.status

    for key, value in payload.model_dump().items():
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


@router.delete(
    "/{ride_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_ride(
    ride_id: int,
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