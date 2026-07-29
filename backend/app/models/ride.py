from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Ride(Base):
    __tablename__ = "rides"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    client_id: Mapped[int] = mapped_column(
        ForeignKey("clients.id"),
        nullable=False,
    )
    horse_id: Mapped[int] = mapped_column(
        ForeignKey("horses.id"),
        nullable=False,
    )
    instructor_id: Mapped[int] = mapped_column(
        ForeignKey("instructors.id"),
        nullable=False,
    )
    pass_id: Mapped[int | None] = mapped_column(
        ForeignKey("passes.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    start_time: Mapped[DateTime] = mapped_column(
        DateTime,
        nullable=False,
    )
    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        default=60,
        nullable=False,
    )

    ride_type: Mapped[str] = mapped_column(
        String(50),
        default="individual",
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="planned",
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    pass_entry_deducted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    client = relationship("Client")
    horse = relationship("Horse")
    instructor = relationship("Instructor")
    pass_obj = relationship("Pass")