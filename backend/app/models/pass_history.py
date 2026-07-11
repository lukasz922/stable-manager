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
        ForeignKey("rides.id"),
        nullable=True,
    )

    operation: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    entries: Mapped[int] = mapped_column(
        Integer,
        default=1,
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

    pass_obj = relationship("Pass")
    ride = relationship("Ride")