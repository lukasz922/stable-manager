from datetime import date

from pydantic import BaseModel, ConfigDict


class PassBase(BaseModel):
    client_id: int
    name: str
    total_entries: int
    remaining_entries: int
    valid_from: date
    valid_until: date
    active: bool = True


class PassCreate(PassBase):
    pass


class PassUpdate(BaseModel):
    client_id: int | None = None
    name: str | None = None
    total_entries: int | None = None
    remaining_entries: int | None = None
    valid_from: date | None = None
    valid_until: date | None = None
    active: bool | None = None


class PassRead(PassBase):
    id: int
    client_name: str | None = None

    model_config = ConfigDict(from_attributes=True)