from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PassHistoryRead(BaseModel):
    id: int
    pass_id: int
    ride_id: int | None

    operation: str
    entries: int
    note: str | None

    created_at: datetime

    ride_date: str | None
    ride_start_time: str | None

    horse_name: str | None
    client_name: str | None
    instructor_name: str | None

    model_config = ConfigDict(from_attributes=True)