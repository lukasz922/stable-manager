from sqlalchemy.orm import Session

from app.models.instructor_availability_request import (
    InstructorAvailabilityRequest,
)


class InstructorAvailabilityRequestRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self):
        return (
            self.db.query(InstructorAvailabilityRequest)
            .order_by(
                InstructorAvailabilityRequest.created_at.desc(),
                InstructorAvailabilityRequest.id.desc(),
            )
            .all()
        )

    def get_by_id(self, request_id: int):
        return (
            self.db.query(InstructorAvailabilityRequest)
            .filter(InstructorAvailabilityRequest.id == request_id)
            .first()
        )

    def create(
        self,
        request: InstructorAvailabilityRequest,
    ):
        self.db.add(request)
        self.db.commit()
        self.db.refresh(request)
        return request

    def update(
        self,
        request: InstructorAvailabilityRequest,
    ):
        self.db.commit()
        self.db.refresh(request)
        return request

    def delete(
        self,
        request: InstructorAvailabilityRequest,
    ):
        self.db.delete(request)
        self.db.commit()