from pydantic import BaseModel


class HorseCreate(BaseModel):
    name: str
    breed: str | None = None
    gender: str | None = None
    color: str | None = None
    height_cm: int | None = None
    max_rider_weight: int | None = None
    max_lessons_per_day: int = 5
    status: str = "available"
    notes: str | None = None


class HorseUpdate(BaseModel):
    name: str | None = None
    breed: str | None = None
    gender: str | None = None
    color: str | None = None
    height_cm: int | None = None
    max_rider_weight: int | None = None
    max_lessons_per_day: int | None = None
    status: str | None = None
    notes: str | None = None


class HorseResponse(HorseCreate):
    id: int
    code: str | None = None

    model_config = {
        "from_attributes": True
    }