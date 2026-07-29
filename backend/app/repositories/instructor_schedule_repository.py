from datetime import date

from sqlalchemy import extract
from sqlalchemy.orm import Session

from app.models.instructor_schedule import InstructorSchedule


class InstructorScheduleRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_month(self, year: int, month: int):
        return (
            self.db.query(InstructorSchedule)
            .filter(extract("year", InstructorSchedule.date) == year)
            .filter(extract("month", InstructorSchedule.date) == month)
            .all()
        )

    def get_by_day(self, instructor_id: int, day: date):
        return (
            self.db.query(InstructorSchedule)
            .filter(
                InstructorSchedule.instructor_id == instructor_id,
                InstructorSchedule.date == day,
            )
            .first()
        )

    def create(self, schedule: InstructorSchedule):
        self.db.add(schedule)
        self.db.commit()
        self.db.refresh(schedule)
        return schedule

    def update(self, schedule: InstructorSchedule):
        self.db.commit()
        self.db.refresh(schedule)
        return schedule

    def delete(self, schedule: InstructorSchedule):
        self.db.delete(schedule)
        self.db.commit()

    def get_by_id(self, schedule_id: int):
        return (
        self.db.query(InstructorSchedule)
        .filter(InstructorSchedule.id == schedule_id)
        .first()
    )