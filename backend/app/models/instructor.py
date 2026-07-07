from sqlalchemy import Column, Integer, String, Float, Text

from app.db.base import Base


class Instructor(Base):
    __tablename__ = "instructors"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)

    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)

    phone = Column(String)
    email = Column(String)

    specialization = Column(String)

    hourly_rate = Column(Float)

    status = Column(String, default="active")

    notes = Column(Text)