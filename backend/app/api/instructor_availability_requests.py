from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import require_permission
from app.db.session import get_db
from app.repositories.instructor_availability_request_repository import (
    InstructorAvailabilityRequestRepository,
)
from app.repositories.instructor_schedule_repository import (
    InstructorScheduleRepository,
)
from app.schemas.instructor_availability_request import (
    InstructorAvailabilityApprovalResult,
    InstructorAvailabilityRequestCreate,
    InstructorAvailabilityRequestDecision,
    InstructorAvailabilityRequestRead,
    InstructorAvailabilityRequestUpdate,
)
from app.services.instructor_availability_request_service import (
    InstructorAvailabilityRequestService,
)

router = APIRouter(
    prefix="/instructor-availability-requests",
    tags=["Instructor Availability Requests"],
)


def get_service(db: Session):
    request_repo = InstructorAvailabilityRequestRepository(db)
    schedule_repo = InstructorScheduleRepository(db)

    return InstructorAvailabilityRequestService(
        request_repo=request_repo,
        schedule_repo=schedule_repo,
    )


@router.get(
    "",
    response_model=list[InstructorAvailabilityRequestRead],
)
def get_all(
    current_user=Depends(require_permission("availability.manage")),
    db: Session = Depends(get_db),
):
    service = get_service(db)
    return service.get_all()


@router.get(
    "/{request_id}",
    response_model=InstructorAvailabilityRequestRead,
)
def get_one(
    request_id: int,
    current_user=Depends(require_permission("availability.manage")),
    db: Session = Depends(get_db),
):
    service = get_service(db)

    try:
        return service.get_by_id(request_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc


@router.post(
    "",
    response_model=InstructorAvailabilityRequestRead,
)
def create(
    data: InstructorAvailabilityRequestCreate,
    current_user=Depends(require_permission("availability.manage")),
    db: Session = Depends(get_db),
):
    service = get_service(db)

    try:
        return service.create(data)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.put(
    "/{request_id}",
    response_model=InstructorAvailabilityRequestRead,
)
def update(
    request_id: int,
    data: InstructorAvailabilityRequestUpdate,
    current_user=Depends(require_permission("availability.manage")),
    db: Session = Depends(get_db),
):
    service = get_service(db)

    try:
        return service.update(request_id, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.delete("/{request_id}")
def delete(
    request_id: int,
    current_user=Depends(require_permission("availability.manage")),
    db: Session = Depends(get_db),
):
    service = get_service(db)

    try:
        service.delete(request_id)
        return {"message": "Zgłoszenie zostało usunięte."}
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.post(
    "/{request_id}/approve",
    response_model=InstructorAvailabilityApprovalResult,
)
def approve(
    request_id: int,
    data: InstructorAvailabilityRequestDecision,
    current_user=Depends(require_permission("availability.manage")),
    db: Session = Depends(get_db),
):
    service = get_service(db)

    try:
        return service.approve(request_id, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.post(
    "/{request_id}/reject",
    response_model=InstructorAvailabilityRequestRead,
)
def reject(
    request_id: int,
    data: InstructorAvailabilityRequestDecision,
    current_user=Depends(require_permission("availability.manage")),
    db: Session = Depends(get_db),
):
    service = get_service(db)

    try:
        return service.reject(request_id, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc