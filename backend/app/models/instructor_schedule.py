from datetime import date, time
from enum import Enum

from sqlalchemy import (
    Column,
    Date,
    Enum as SqlEnum,
    ForeignKey,
    Integer,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.db.base import Base


class ScheduleStatus(str, Enum):
    WORK = "WORK"
    OFF = "OFF"
    VACATION = "VACATION"
    SICK = "SICK"
    TRAINING = "TRAINING"


class InstructorSchedule(Base):
    __tablename__ = "instructor_schedule"

    id = Column(Integer, primary_key=True, index=True)

    instructor_id = Column(
        Integer,
        ForeignKey("instructors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    date = Column(Date, nullable=False, index=True)

    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    availability_start_time = Column(Time, nullable=True)
    availability_end_time = Column(Time, nullable=True)
    
    status = Column(
        SqlEnum(ScheduleStatus),
        nullable=False,
        default=ScheduleStatus.WORK,
    )

    note = Column(Text, nullable=True)

    instructor = relationship("Instructor")

    __table_args__ = (
        UniqueConstraint(
            "instructor_id",
            "date",
            name="uq_instructor_schedule",
        ),
    )