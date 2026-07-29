from datetime import datetime
from enum import Enum

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum as SqlEnum,
    ForeignKey,
    Integer,
    JSON,
    Text,
    Time,
)
from sqlalchemy.orm import relationship

from app.db.base import Base


class AvailabilityRequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class InstructorAvailabilityRequest(Base):
    __tablename__ = "instructor_availability_requests"

    id = Column(Integer, primary_key=True, index=True)

    instructor_id = Column(
        Integer,
        ForeignKey("instructors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    date_from = Column(Date, nullable=False, index=True)
    date_to = Column(Date, nullable=False, index=True)

    weekdays = Column(JSON, nullable=True)

    availability_start_time = Column(Time, nullable=False)
    availability_end_time = Column(Time, nullable=False)

    status = Column(
        SqlEnum(AvailabilityRequestStatus),
        nullable=False,
        default=AvailabilityRequestStatus.PENDING,
        index=True,
    )

    note = Column(Text, nullable=True)
    admin_note = Column(Text, nullable=True)

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
        onupdate=datetime.now,
    )

    instructor = relationship("Instructor")