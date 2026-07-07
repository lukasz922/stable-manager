from pydantic import BaseModel, ConfigDict


class InstructorBase(BaseModel):
    first_name: str
    last_name: str
    phone: str | None = None
    email: str | None = None
    specialization: str | None = None
    hourly_rate: float | None = None
    status: str = "active"
    notes: str | None = None


class InstructorCreate(InstructorBase):
    pass


class InstructorUpdate(InstructorBase):
    pass


class InstructorRead(InstructorBase):
    id: int
    code: str | None = None

    model_config = ConfigDict(from_attributes=True)