from datetime import datetime

from pydantic import BaseModel, ConfigDict


class RideBase(BaseModel):
    client_id: int
    horse_id: int
    instructor_id: int

    start_time: datetime
    duration_minutes: int = 60

    ride_type: str = "individual"
    status: str = "planned"

    notes: str | None = None


class RideCreate(RideBase):
    pass


class RideUpdate(RideBase):
    pass


class RideRead(RideBase):
    id: int

    client_name: str | None = None
    horse_name: str | None = None
    instructor_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class RideStatusUpdate(BaseModel):
    status: str