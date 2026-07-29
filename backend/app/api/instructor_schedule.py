from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import require_permission

from app.repositories.instructor_schedule_repository import (
    InstructorScheduleRepository,
)
from app.schemas.instructor_schedule import (
    InstructorScheduleCreate,
    InstructorScheduleRangeCreate,
    InstructorScheduleRangeDelete,
    InstructorScheduleRangeUpdate,
    InstructorScheduleRead,
    InstructorScheduleUpdate,
)
from app.services.instructor_schedule_service import (
    InstructorScheduleService,
)
router = APIRouter(
    prefix="/instructor-schedule",
    tags=["Instructor Schedule"],
)


def get_service(db: Session):
    repo = InstructorScheduleRepository(db)
    return InstructorScheduleService(repo)

class InstructorScheduleCopy(BaseModel):
    source_year: int
    source_month: int
    target_year: int
    target_month: int

@router.get(
    "",
    response_model=list[InstructorScheduleRead],
)
def get_month(
    year: int,
    month: int,
    current_user=Depends(require_permission("schedule.view")),
    db: Session = Depends(get_db),
):
    service = get_service(db)
    return service.get_month(year, month)


@router.post(
    "/save",
    response_model=InstructorScheduleRead,
)
def save(
    data: InstructorScheduleCreate,
    current_user=Depends(require_permission("schedule.manage")),
    db: Session = Depends(get_db),
):
    service = get_service(db)

    try:
        return service.save(data)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

@router.post("/range")
def save_range(
    data: InstructorScheduleRangeCreate,
    current_user=Depends(require_permission("schedule.manage")),
    db: Session = Depends(get_db),
):
    service = get_service(db)

    try:
        return service.save_range(data)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

@router.put("/range")
def update_range(
    data: InstructorScheduleRangeUpdate,
    current_user=Depends(require_permission("schedule.manage")),
    db: Session = Depends(get_db),
):
    service = get_service(db)

    try:
        return service.update_range(data)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.delete("/range")
def delete_range(
    data: InstructorScheduleRangeDelete,
    current_user=Depends(require_permission("schedule.manage")),
    db: Session = Depends(get_db),
):
    service = get_service(db)

    try:
        return service.delete_range(data)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.put(
    "/{schedule_id}",
    response_model=InstructorScheduleRead,
)
def update(
    schedule_id: int,
    data: InstructorScheduleUpdate,
    current_user=Depends(require_permission("schedule.manage")),
    db: Session = Depends(get_db),
):
    service = get_service(db)

    try:
        return service.update(schedule_id, data)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.delete("/{schedule_id}")
def delete(
    schedule_id: int,
    current_user=Depends(require_permission("schedule.manage")),
    db: Session = Depends(get_db),
):
    service = get_service(db)

    try:
        service.delete(schedule_id)
        return {"message": "Usunięto"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/copy")
def copy_schedule(
    data: InstructorScheduleCopy,
    current_user=Depends(require_permission("schedule.manage")),
    db: Session = Depends(get_db),
):
    service = get_service(db)

    copied = service.copy(
        data.source_year,
        data.source_month,
        data.target_year,
        data.target_month,
    )

    return {"copied": copied}
    