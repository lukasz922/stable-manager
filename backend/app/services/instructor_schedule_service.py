from calendar import monthrange
from datetime import date, timedelta

from app.models.instructor_schedule import (
    InstructorSchedule,
    ScheduleStatus,
)
from app.repositories.instructor_schedule_repository import (
    InstructorScheduleRepository,
)
from app.schemas.instructor_schedule import (
    InstructorScheduleCreate,
    InstructorScheduleRangeCreate,
    InstructorScheduleRangeDelete,
    InstructorScheduleRangeUpdate,
    InstructorScheduleUpdate,
)


class InstructorScheduleService:
    def __init__(self, repo: InstructorScheduleRepository):
        self.repo = repo

    def get_month(self, year: int, month: int):
        return self.repo.get_month(year, month)

    def save(self, data: InstructorScheduleCreate):
        existing = self.repo.get_by_day(
            data.instructor_id,
            data.date,
        )

        self._validate_and_normalize(data)

        if existing:
            existing.start_time = data.start_time
            existing.end_time = data.end_time
            existing.availability_start_time = data.availability_start_time
            existing.availability_end_time = data.availability_end_time
            existing.status = data.status
            existing.note = data.note

            return self.repo.update(existing)

        schedule = InstructorSchedule(**data.model_dump())
        return self.repo.create(schedule)

    def update(
        self,
        schedule_id: int,
        data: InstructorScheduleUpdate,
    ):
        schedule = self.repo.get_by_id(schedule_id)

        if not schedule:
            raise ValueError("Grafik nie istnieje.")

        self._validate_and_normalize(data)

        schedule.start_time = data.start_time
        schedule.end_time = data.end_time
        schedule.availability_start_time = data.availability_start_time
        schedule.availability_end_time = data.availability_end_time
        schedule.status = data.status
        schedule.note = data.note

        return self.repo.update(schedule)

    def delete(self, schedule_id: int):
        schedule = self.repo.get_by_id(schedule_id)

        if not schedule:
            raise ValueError("Grafik nie istnieje.")

        self.repo.delete(schedule)

    def save_range(
        self,
        data: InstructorScheduleRangeCreate,
    ) -> dict:
        if data.date_from > data.date_to:
            raise ValueError(
                "Data końcowa nie może być wcześniejsza od początkowej."
            )

        selected_weekdays = None

        if data.weekdays is not None:
            selected_weekdays = set(data.weekdays)

            if not selected_weekdays:
                raise ValueError(
                    "Należy wybrać co najmniej jeden dzień tygodnia."
                )

            invalid_weekdays = selected_weekdays.difference(range(7))

            if invalid_weekdays:
                raise ValueError(
                    "Dni tygodnia muszą mieć wartości od 0 do 6."
                )

        validation_data = InstructorScheduleCreate(
            instructor_id=data.instructor_id,
            date=data.date_from,
            start_time=data.start_time,
            end_time=data.end_time,
            availability_start_time=data.availability_start_time,
            availability_end_time=data.availability_end_time,
            status=data.status,
            note=data.note,
        )

        self._validate_and_normalize(validation_data)

        current_date = data.date_from
        created = 0
        updated = 0
        skipped = 0

        while current_date <= data.date_to:
            weekday = current_date.weekday()

            if (
                selected_weekdays is not None
                and weekday not in selected_weekdays
            ):
                skipped += 1
                current_date += timedelta(days=1)
                continue

            if (
                selected_weekdays is None
                and data.skip_weekends
                and weekday >= 5
            ):
                skipped += 1
                current_date += timedelta(days=1)
                continue

            existing = self.repo.get_by_day(
                data.instructor_id,
                current_date,
            )

            if existing and not data.overwrite_existing:
                skipped += 1
                current_date += timedelta(days=1)
                continue

            if existing:
                existing.start_time = validation_data.start_time
                existing.end_time = validation_data.end_time
                existing.availability_start_time = (
                    validation_data.availability_start_time
                )
                existing.availability_end_time = (
                    validation_data.availability_end_time
                )
                existing.status = validation_data.status
                existing.note = validation_data.note

                self.repo.update(existing)
                updated += 1
            else:
                schedule = InstructorSchedule(
                    instructor_id=data.instructor_id,
                    date=current_date,
                    start_time=validation_data.start_time,
                    end_time=validation_data.end_time,
                    availability_start_time=(
                        validation_data.availability_start_time
                    ),
                    availability_end_time=(
                        validation_data.availability_end_time
                    ),
                    status=validation_data.status,
                    note=validation_data.note,
                )

                self.repo.create(schedule)
                created += 1

            current_date += timedelta(days=1)

        return {
            "created": created,
            "updated": updated,
            "skipped": skipped,
        }

    def update_range(
        self,
        data: InstructorScheduleRangeUpdate,
    ) -> dict:
        if data.date_from > data.date_to:
            raise ValueError(
                "Data końcowa nie może być wcześniejsza od początkowej."
            )

        selected_weekdays = self._normalize_weekdays(data.weekdays)

        validation_data = InstructorScheduleCreate(
            instructor_id=data.instructor_id,
            date=data.date_from,
            start_time=data.start_time,
            end_time=data.end_time,
            availability_start_time=data.availability_start_time,
            availability_end_time=data.availability_end_time,
            status=data.status,
            note=data.note,
        )

        self._validate_and_normalize(validation_data)

        current_date = data.date_from
        updated = 0
        skipped = 0

        while current_date <= data.date_to:
            if (
                selected_weekdays is not None
                and current_date.weekday() not in selected_weekdays
            ):
                skipped += 1
                current_date += timedelta(days=1)
                continue

            existing = self.repo.get_by_day(
                data.instructor_id,
                current_date,
            )

            if not existing:
                skipped += 1
                current_date += timedelta(days=1)
                continue

            existing.start_time = validation_data.start_time
            existing.end_time = validation_data.end_time
            existing.availability_start_time = (
                validation_data.availability_start_time
            )
            existing.availability_end_time = (
                validation_data.availability_end_time
            )
            existing.status = validation_data.status
            existing.note = validation_data.note

            self.repo.update(existing)
            updated += 1
            current_date += timedelta(days=1)

        return {
            "updated": updated,
            "skipped": skipped,
        }

    def delete_range(
        self,
        data: InstructorScheduleRangeDelete,
    ) -> dict:
        if data.date_from > data.date_to:
            raise ValueError(
                "Data końcowa nie może być wcześniejsza od początkowej."
            )

        selected_weekdays = self._normalize_weekdays(data.weekdays)

        current_date = data.date_from
        deleted = 0
        skipped = 0

        while current_date <= data.date_to:
            if (
                selected_weekdays is not None
                and current_date.weekday() not in selected_weekdays
            ):
                skipped += 1
                current_date += timedelta(days=1)
                continue

            existing = self.repo.get_by_day(
                data.instructor_id,
                current_date,
            )

            if not existing:
                skipped += 1
                current_date += timedelta(days=1)
                continue

            self.repo.delete(existing)
            deleted += 1
            current_date += timedelta(days=1)

        return {
            "deleted": deleted,
            "skipped": skipped,
        }

    def copy(
        self,
        source_year: int,
        source_month: int,
        target_year: int,
        target_month: int,
    ) -> int:
        if not 1 <= source_month <= 12:
            raise ValueError(
                "Miesiąc źródłowy musi być w zakresie 1-12."
            )

        if not 1 <= target_month <= 12:
            raise ValueError(
                "Miesiąc docelowy musi być w zakresie 1-12."
            )

        source_entries = self.repo.get_month(
            source_year,
            source_month,
        )

        _, days_in_target = monthrange(
            target_year,
            target_month,
        )

        copied = 0

        for item in source_entries:
            if item.date.day > days_in_target:
                continue

            new_date = date(
                target_year,
                target_month,
                item.date.day,
            )

            existing = self.repo.get_by_day(
                item.instructor_id,
                new_date,
            )

            if existing:
                continue

            self.repo.create(
                InstructorSchedule(
                    instructor_id=item.instructor_id,
                    date=new_date,
                    start_time=item.start_time,
                    end_time=item.end_time,
                    availability_start_time=(
                        item.availability_start_time
                    ),
                    availability_end_time=(
                        item.availability_end_time
                    ),
                    status=item.status,
                    note=item.note,
                )
            )

            copied += 1

        return copied

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

    def _validate_and_normalize(self, data):
        if data.status != ScheduleStatus.WORK:
            data.start_time = None
            data.end_time = None
            return

        if data.start_time is None or data.end_time is None:
            raise ValueError(
                "Dla statusu Praca należy podać godziny pracy."
            )

        if data.start_time >= data.end_time:
            raise ValueError(
                "Godzina zakończenia musi być późniejsza "
                "niż godzina rozpoczęcia."
            )

        availability_start = data.availability_start_time
        availability_end = data.availability_end_time

        if bool(availability_start) != bool(availability_end):
            raise ValueError(
                "Należy podać obie godziny dyspozycyjności."
            )

        if (
            availability_start
            and availability_end
            and availability_start >= availability_end
        ):
            raise ValueError(
                "Koniec dyspozycyjności musi być późniejszy "
                "niż jej początek."
            )

        if (
            availability_start
            and availability_end
            and (
                data.start_time < availability_start
                or data.end_time > availability_end
            )
        ):
            raise ValueError(
                "Godziny pracy muszą mieścić się "
                "w dyspozycyjności."
            )