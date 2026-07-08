from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.ride import Ride
from app.schemas.ride import RideCreate, RideRead

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
        client_name=f"{ride.client.first_name} {ride.client.last_name}" if ride.client else None,
        horse_name=ride.horse.name if ride.horse else None,
        instructor_name=f"{ride.instructor.first_name} {ride.instructor.last_name}" if ride.instructor else None,
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
        .all()
    )

    return [ride_to_read(ride) for ride in rides]


@router.post("", response_model=RideRead)
def create_ride(payload: RideCreate, db: Session = Depends(get_db)):
    ride = Ride(**payload.model_dump())

    db.add(ride)
    db.commit()
    db.refresh(ride)

    ride = (
        db.query(Ride)
        .options(
            joinedload(Ride.client),
            joinedload(Ride.horse),
            joinedload(Ride.instructor),
        )
        .filter(Ride.id == ride.id)
        .first()
    )

    return ride_to_read(ride)


@router.get("/{ride_id}", response_model=RideRead)
def get_ride(ride_id: int, db: Session = Depends(get_db)):
    ride = (
        db.query(Ride)
        .options(
            joinedload(Ride.client),
            joinedload(Ride.horse),
            joinedload(Ride.instructor),
        )
        .filter(Ride.id == ride_id)
        .first()
    )

    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    return ride_to_read(ride)


@router.put("/{ride_id}", response_model=RideRead)
def update_ride(ride_id: int, payload: RideCreate, db: Session = Depends(get_db)):
    ride = db.get(Ride, ride_id)

    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    for key, value in payload.model_dump().items():
        setattr(ride, key, value)

    db.commit()

    ride = (
        db.query(Ride)
        .options(
            joinedload(Ride.client),
            joinedload(Ride.horse),
            joinedload(Ride.instructor),
        )
        .filter(Ride.id == ride_id)
        .first()
    )

    return ride_to_read(ride)


@router.delete("/{ride_id}", status_code=204)
def delete_ride(ride_id: int, db: Session = Depends(get_db)):
    ride = db.get(Ride, ride_id)

    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    db.delete(ride)
    db.commit()