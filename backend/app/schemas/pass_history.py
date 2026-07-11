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

    model_config = ConfigDict(from_attributes=True)