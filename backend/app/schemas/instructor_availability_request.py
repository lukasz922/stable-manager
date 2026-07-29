from datetime import date, datetime, time
from enum import Enum

from pydantic import BaseModel, ConfigDict, field_validator


class AvailabilityRequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class InstructorAvailabilityRequestBase(BaseModel):
    instructor_id: int
    date_from: date
    date_to: date
    weekdays: list[int] | None = None
    availability_start_time: time
    availability_end_time: time
    note: str | None = None

    @field_validator("weekdays")
    @classmethod
    def validate_weekdays(
        cls,
        value: list[int] | None,
    ) -> list[int] | None:
        if value is None:
            return None

        normalized = sorted(set(value))

        if any(day < 0 or day > 6 for day in normalized):
            raise ValueError(
                "Dni tygodnia muszą mieć wartości od 0 do 6."
            )

        return normalized


class InstructorAvailabilityRequestCreate(
    InstructorAvailabilityRequestBase
):
    pass


class InstructorAvailabilityRequestUpdate(
    InstructorAvailabilityRequestBase
):
    pass


class InstructorAvailabilityRequestDecision(BaseModel):
    admin_note: str | None = None


class InstructorAvailabilityRequestRead(
    InstructorAvailabilityRequestBase
):
    id: int
    status: AvailabilityRequestStatus
    admin_note: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InstructorAvailabilityApprovalResult(BaseModel):
    request_id: int
    status: AvailabilityRequestStatus
    created: int
    updated: int
    skipped: int