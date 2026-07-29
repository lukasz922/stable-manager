from datetime import date, time

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy import extract
from sqlalchemy.orm import Session, joinedload

from app.api.rides import ride_to_read
from app.core.dependencies import get_current_instructor
from app.db.session import get_db
from app.models.instructor import Instructor
from app.models.instructor_availability_request import (
    AvailabilityRequestStatus,
    InstructorAvailabilityRequest,
)
from app.models.instructor_schedule import InstructorSchedule
from app.models.ride import Ride
from app.schemas.instructor import InstructorRead
from app.schemas.instructor_availability_request import (
    InstructorAvailabilityRequestRead,
)
from app.schemas.instructor_schedule import InstructorScheduleRead
from app.schemas.ride import RideRead

router = APIRouter(
    prefix="/instructor-me",
    tags=["Instructor Me"],
)


class MyAvailabilityRequestCreate(BaseModel):
    date_from: date
    date_to: date
    weekdays: list[int] | None = None
    availability_start_time: time
    availability_end_time: time
    note: str | None = None

    @field_validator("weekdays")
    @classmethod
    def validate_weekdays(
        cls,
        value: list[int] | None,
    ) -> list[int] | None:
        if value is None:
            return None

        normalized = sorted(set(value))

        if not normalized:
            raise ValueError(
                "Należy wybrać co najmniej jeden dzień tygodnia."
            )

        if any(day < 0 or day > 6 for day in normalized):
            raise ValueError(
                "Dni tygodnia muszą mieć wartości od 0 do 6."
            )

        return normalized


@router.get("", response_model=InstructorRead)
def get_my_profile(
    instructor: Instructor = Depends(get_current_instructor),
):
    return instructor


@router.get(
    "/schedule",
    response_model=list[InstructorScheduleRead],
)
def get_my_schedule(
    year: int,
    month: int,
    instructor: Instructor = Depends(get_current_instructor),
    db: Session = Depends(get_db),
):
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=400,
            detail="Miesiąc musi być w zakresie 1-12.",
        )

    return (
        db.query(InstructorSchedule)
        .filter(
            InstructorSchedule.instructor_id == instructor.id,
            extract("year", InstructorSchedule.date) == year,
            extract("month", InstructorSchedule.date) == month,
        )
        .order_by(InstructorSchedule.date.asc())
        .all()
    )


@router.get(
    "/rides",
    response_model=list[RideRead],
)
def get_my_rides(
    date_from: date | None = None,
    date_to: date | None = None,
    instructor: Instructor = Depends(get_current_instructor),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Ride)
        .options(
            joinedload(Ride.client),
            joinedload(Ride.horse),
            joinedload(Ride.instructor),
        )
        .filter(Ride.instructor_id == instructor.id)
    )

    if date_from is not None:
        query = query.filter(
            Ride.start_time >= date_from
        )

    if date_to is not None:
        query = query.filter(
            Ride.start_time < date.fromordinal(
                date_to.toordinal() + 1
            )
        )

    rides = query.order_by(Ride.start_time.asc()).all()
    return [ride_to_read(ride) for ride in rides]


@router.get(
    "/availability-requests",
    response_model=list[InstructorAvailabilityRequestRead],
)
def get_my_availability_requests(
    instructor: Instructor = Depends(get_current_instructor),
    db: Session = Depends(get_db),
):
    return (
        db.query(InstructorAvailabilityRequest)
        .filter(
            InstructorAvailabilityRequest.instructor_id
            == instructor.id
        )
        .order_by(
            InstructorAvailabilityRequest.created_at.desc(),
            InstructorAvailabilityRequest.id.desc(),
        )
        .all()
    )


@router.post(
    "/availability-requests",
    response_model=InstructorAvailabilityRequestRead,
)
def create_my_availability_request(
    payload: MyAvailabilityRequestCreate,
    instructor: Instructor = Depends(get_current_instructor),
    db: Session = Depends(get_db),
):
    if payload.date_from > payload.date_to:
        raise HTTPException(
            status_code=400,
            detail=(
                "Data końcowa nie może być wcześniejsza "
                "od daty początkowej."
            ),
        )

    if (
        payload.availability_start_time
        >= payload.availability_end_time
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Koniec dyspozycyjności musi być późniejszy "
                "niż jej początek."
            ),
        )

    request = InstructorAvailabilityRequest(
        instructor_id=instructor.id,
        date_from=payload.date_from,
        date_to=payload.date_to,
        weekdays=payload.weekdays,
        availability_start_time=(
            payload.availability_start_time
        ),
        availability_end_time=payload.availability_end_time,
        note=payload.note,
        status=AvailabilityRequestStatus.PENDING,
    )

    db.add(request)
    db.commit()
    db.refresh(request)

    return request

@router.put(
    "/availability-requests/{request_id}",
    response_model=InstructorAvailabilityRequestRead,
)
def update_my_availability_request(
    request_id: int,
    payload: MyAvailabilityRequestCreate,
    instructor: Instructor = Depends(get_current_instructor),
    db: Session = Depends(get_db),
):
    request = (
        db.query(InstructorAvailabilityRequest)
        .filter(
            InstructorAvailabilityRequest.id == request_id,
            InstructorAvailabilityRequest.instructor_id == instructor.id,
        )
        .first()
    )

    if request is None:
        raise HTTPException(
            status_code=404,
            detail="Nie znaleziono zgłoszenia dyspozycyjności.",
        )

    if request.status != AvailabilityRequestStatus.PENDING:
        raise HTTPException(
            status_code=409,
            detail="Można edytować tylko oczekujące zgłoszenie.",
        )

    if payload.date_from > payload.date_to:
        raise HTTPException(
            status_code=400,
            detail=(
                "Data końcowa nie może być wcześniejsza "
                "od daty początkowej."
            ),
        )

    if (
        payload.availability_start_time
        >= payload.availability_end_time
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Koniec dyspozycyjności musi być późniejszy "
                "niż jej początek."
            ),
        )

    request.date_from = payload.date_from
    request.date_to = payload.date_to
    request.weekdays = payload.weekdays
    request.availability_start_time = (
        payload.availability_start_time
    )
    request.availability_end_time = payload.availability_end_time
    request.note = payload.note

    db.commit()
    db.refresh(request)

    return request


@router.delete(
    "/availability-requests/{request_id}",
    status_code=204,
)
def delete_my_availability_request(
    request_id: int,
    instructor: Instructor = Depends(get_current_instructor),
    db: Session = Depends(get_db),
):
    request = (
        db.query(InstructorAvailabilityRequest)
        .filter(
            InstructorAvailabilityRequest.id == request_id,
            InstructorAvailabilityRequest.instructor_id == instructor.id,
        )
        .first()
    )

    if request is None:
        raise HTTPException(
            status_code=404,
            detail="Nie znaleziono zgłoszenia dyspozycyjności.",
        )

    if request.status != AvailabilityRequestStatus.PENDING:
        raise HTTPException(
            status_code=409,
            detail="Można usunąć tylko oczekujące zgłoszenie.",
        )

    db.delete(request)
    db.commit()
