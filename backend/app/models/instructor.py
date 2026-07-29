from sqlalchemy import (
    Column,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.db.base import Base


class Instructor(Base):
    __tablename__ = "instructors"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)

    phone = Column(String)
    email = Column(String)

    specialization = Column(String)

    hourly_rate = Column(Float)

    status = Column(String, default="active")

    notes = Column(Text)

    user = relationship("User")

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            name="uq_instructors_user_id",
        ),
    )