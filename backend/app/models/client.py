from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    riding_level: Mapped[str | None] = mapped_column(String(50), nullable=True)

    barcode: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    qr_code: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    rfid_uid: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)