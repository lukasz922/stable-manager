from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.instructor import Instructor
from app.schemas.instructor import InstructorCreate, InstructorRead, InstructorUpdate

router = APIRouter(prefix="/instructors", tags=["Instructors"])


def generate_instructor_code(instructor_id: int) -> str:
    return f"I-{instructor_id:06d}"


@router.get("", response_model=list[InstructorRead])
def list_instructors(db: Session = Depends(get_db)):
    return db.query(Instructor).order_by(Instructor.last_name.asc()).all()


@router.post("", response_model=InstructorRead)
def create_instructor(payload: InstructorCreate, db: Session = Depends(get_db)):
    instructor = Instructor(**payload.model_dump())

    db.add(instructor)
    db.commit()
    db.refresh(instructor)

    if not instructor.code:
        instructor.code = generate_instructor_code(instructor.id)
        db.commit()
        db.refresh(instructor)

    return instructor


@router.get("/{instructor_id}", response_model=InstructorRead)
def get_instructor(instructor_id: int, db: Session = Depends(get_db)):
    instructor = db.query(Instructor).filter(Instructor.id == instructor_id).first()

    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")

    return instructor


@router.put("/{instructor_id}", response_model=InstructorRead)
def update_instructor(
    instructor_id: int,
    payload: InstructorUpdate,
    db: Session = Depends(get_db),
):
    instructor = db.query(Instructor).filter(Instructor.id == instructor_id).first()

    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")

    for field, value in payload.model_dump().items():
        setattr(instructor, field, value)

    db.commit()
    db.refresh(instructor)

    return instructor


@router.delete("/{instructor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_instructor(instructor_id: int, db: Session = Depends(get_db)):
    instructor = db.query(Instructor).filter(Instructor.id == instructor_id).first()

    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found")

    db.delete(instructor)
    db.commit()