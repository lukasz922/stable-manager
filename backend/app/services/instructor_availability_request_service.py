from datetime import timedelta

from app.models.instructor_availability_request import (
    AvailabilityRequestStatus,
    InstructorAvailabilityRequest,
)
from app.models.instructor_schedule import (
    InstructorSchedule,
    ScheduleStatus,
)
from app.repositories.instructor_availability_request_repository import (
    InstructorAvailabilityRequestRepository,
)
from app.repositories.instructor_schedule_repository import (
    InstructorScheduleRepository,
)
from app.schemas.instructor_availability_request import (
    InstructorAvailabilityRequestCreate,
    InstructorAvailabilityRequestDecision,
    InstructorAvailabilityRequestUpdate,
)


class InstructorAvailabilityRequestService:
    def __init__(
        self,
        request_repo: InstructorAvailabilityRequestRepository,
        schedule_repo: InstructorScheduleRepository,
    ):
        self.request_repo = request_repo
        self.schedule_repo = schedule_repo

    def get_all(self):
        return self.request_repo.get_all()

    def get_by_id(self, request_id: int):
        request = self.request_repo.get_by_id(request_id)

        if request is None:
            raise ValueError(
                "Zgłoszenie dyspozycyjności nie istnieje."
            )

        return request

    def create(
        self,
        data: InstructorAvailabilityRequestCreate,
    ):
        self._validate(data)

        request = InstructorAvailabilityRequest(
            **data.model_dump(),
            status=AvailabilityRequestStatus.PENDING,
        )

        return self.request_repo.create(request)

    def update(
        self,
        request_id: int,
        data: InstructorAvailabilityRequestUpdate,
    ):
        request = self.get_by_id(request_id)

        if request.status != AvailabilityRequestStatus.PENDING:
            raise ValueError(
                "Można edytować tylko oczekujące zgłoszenie."
            )

        self._validate(data)

        for key, value in data.model_dump().items():
            setattr(request, key, value)

        return self.request_repo.update(request)

    def delete(self, request_id: int):
        request = self.get_by_id(request_id)

        if request.status != AvailabilityRequestStatus.PENDING:
            raise ValueError(
                "Można usunąć tylko oczekujące zgłoszenie."
            )

        self.request_repo.delete(request)

    def approve(
        self,
        request_id: int,
        decision: InstructorAvailabilityRequestDecision,
    ) -> dict:
        request = self.get_by_id(request_id)

        if request.status != AvailabilityRequestStatus.PENDING:
            raise ValueError(
                "To zgłoszenie zostało już rozpatrzone."
            )

        selected_weekdays = self._normalize_weekdays(
            request.weekdays
        )

        current_date = request.date_from
        created = 0
        updated = 0
        skipped = 0

        while current_date <= request.date_to:
            if (
                selected_weekdays is not None
                and current_date.weekday() not in selected_weekdays
            ):
                skipped += 1
                current_date += timedelta(days=1)
                continue

            existing = self.schedule_repo.get_by_day(
                request.instructor_id,
                current_date,
            )

            if existing:
                existing.availability_start_time = (
                    request.availability_start_time
                )
                existing.availability_end_time = (
                    request.availability_end_time
                )

                if existing.status == ScheduleStatus.WORK:
                    if existing.start_time is None:
                        existing.start_time = (
                            request.availability_start_time
                        )

                    if existing.end_time is None:
                        existing.end_time = (
                            request.availability_end_time
                        )

                    if (
                        existing.start_time
                        < request.availability_start_time
                        or existing.end_time
                        > request.availability_end_time
                    ):
                        skipped += 1
                        current_date += timedelta(days=1)
                        continue

                self.schedule_repo.update(existing)
                updated += 1
            else:
                schedule = InstructorSchedule(
                    instructor_id=request.instructor_id,
                    date=current_date,
                    start_time=request.availability_start_time,
                    end_time=request.availability_end_time,
                    availability_start_time=(
                        request.availability_start_time
                    ),
                    availability_end_time=(
                        request.availability_end_time
                    ),
                    status=ScheduleStatus.WORK,
                    note=request.note,
                )

                self.schedule_repo.create(schedule)
                created += 1

            current_date += timedelta(days=1)

        request.status = AvailabilityRequestStatus.APPROVED
        request.admin_note = decision.admin_note
        self.request_repo.update(request)

        return {
            "request_id": request.id,
            "status": request.status,
            "created": created,
            "updated": updated,
            "skipped": skipped,
        }

    def reject(
        self,
        request_id: int,
        decision: InstructorAvailabilityRequestDecision,
    ):
        request = self.get_by_id(request_id)

        if request.status != AvailabilityRequestStatus.PENDING:
            raise ValueError(
                "To zgłoszenie zostało już rozpatrzone."
            )

        request.status = AvailabilityRequestStatus.REJECTED
        request.admin_note = decision.admin_note

        return self.request_repo.update(request)

    def _validate(self, data):
        if data.date_from > data.date_to:
            raise ValueError(
                "Data końcowa nie może być wcześniejsza "
                "od daty początkowej."
            )

        if (
            data.availability_start_time
            >= data.availability_end_time
        ):
            raise ValueError(
                "Koniec dyspozycyjności musi być późniejszy "
                "niż jej początek."
            )

        self._normalize_weekdays(data.weekdays)

    def _normalize_weekdays(
        self,
        weekdays: list[int] | None,
    ) -> set[int] | None:
        if weekdays is None:
            return None

        selected_weekdays = set(weekdays)

        if not selected_weekdays:
            raise ValueError(
                "Należy wybrać co najmniej jeden dzień tygodnia."
            )

        invalid_weekdays = selected_weekdays.difference(range(7))

        if invalid_weekdays:
            raise ValueError(
                "Dni tygodnia muszą mieć wartości od 0 do 6."
            )

        return selected_weekdays