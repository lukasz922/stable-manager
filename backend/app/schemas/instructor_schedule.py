from datetime import date, time
from enum import Enum

from pydantic import BaseModel, ConfigDict


class ScheduleStatus(str, Enum):
    WORK = "WORK"
    OFF = "OFF"
    VACATION = "VACATION"
    SICK = "SICK"
    TRAINING = "TRAINING"


class InstructorScheduleBase(BaseModel):
    instructor_id: int
    date: date

    start_time: time | None = None
    end_time: time | None = None

    availability_start_time: time | None = None
    availability_end_time: time | None = None

    status: ScheduleStatus = ScheduleStatus.WORK
    note: str | None = None


class InstructorScheduleCreate(InstructorScheduleBase):
    pass


class InstructorScheduleUpdate(InstructorScheduleBase):
    pass


class InstructorScheduleRead(InstructorScheduleBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class InstructorScheduleRangeCreate(BaseModel):
    instructor_id: int

    date_from: date
    date_to: date

    start_time: time | None = None
    end_time: time | None = None

    availability_start_time: time | None = None
    availability_end_time: time | None = None

    status: ScheduleStatus = ScheduleStatus.WORK
    note: str | None = None

    # Numery zgodne z datetime.date.weekday():
    # 0 = poniedziałek, 1 = wtorek, ..., 6 = niedziela.
    weekdays: list[int] | None = None

    skip_weekends: bool = True
    overwrite_existing: bool = False


class InstructorScheduleRangeUpdate(BaseModel):
    instructor_id: int

    date_from: date
    date_to: date

    start_time: time | None = None
    end_time: time | None = None

    availability_start_time: time | None = None
    availability_end_time: time | None = None

    status: ScheduleStatus = ScheduleStatus.WORK
    note: str | None = None

    # Aktualizowane są tylko wpisy z wybranych dni tygodnia.
    # None oznacza wszystkie dni w zakresie.
    weekdays: list[int] | None = None


class InstructorScheduleRangeDelete(BaseModel):
    instructor_id: int

    date_from: date
    date_to: date

    # Usuwane są tylko wpisy z wybranych dni tygodnia.
    # None oznacza wszystkie dni w zakresie.
    weekdays: list[int] | None = None