from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Pass(Base):
    __tablename__ = "passes"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    client_id: Mapped[int] = mapped_column(
        ForeignKey("clients.id"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    total_entries: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    remaining_entries: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    valid_from: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    valid_until: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    client = relationship(
        "Client",
        lazy="joined",
    )

    @property
    def is_expired(self) -> bool:
        return self.valid_until < date.today()

    @property
    def is_empty(self) -> bool:
        return self.remaining_entries <= 0