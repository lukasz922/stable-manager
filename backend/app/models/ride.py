from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Ride(Base):
    __tablename__ = "rides"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), nullable=False)
    horse_id: Mapped[int] = mapped_column(ForeignKey("horses.id"), nullable=False)
    instructor_id: Mapped[int] = mapped_column(ForeignKey("instructors.id"), nullable=False)

    start_time: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)

    ride_type: Mapped[str] = mapped_column(String(50), default="individual")
    status: Mapped[str] = mapped_column(String(50), default="planned")

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    client = relationship("Client")
    horse = relationship("Horse")
    instructor = relationship("Instructor")