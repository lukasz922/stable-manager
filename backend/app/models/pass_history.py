from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PassHistory(Base):
    __tablename__ = "pass_history"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    pass_id: Mapped[int] = mapped_column(
        ForeignKey("passes.id"),
        nullable=False,
    )

    ride_id: Mapped[int | None] = mapped_column(
        ForeignKey("rides.id", ondelete="SET NULL"),
        nullable=True,
    )

    operation: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    entries: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    note: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    ride_date: Mapped[str | None] = mapped_column(
        String(10),
        nullable=True,
    )

    ride_start_time: Mapped[str | None] = mapped_column(
        String(5),
        nullable=True,
    )

    horse_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    client_name: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    instructor_name: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    pass_obj = relationship("Pass")
    ride = relationship("Ride")