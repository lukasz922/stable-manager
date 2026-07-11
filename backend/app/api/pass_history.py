from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.pass_history import PassHistory
from app.schemas.pass_history import PassHistoryRead

router = APIRouter(
    prefix="/pass-history",
    tags=["Pass History"],
)


@router.get(
    "/{pass_id}",
    response_model=list[PassHistoryRead],
)
def get_pass_history(
    pass_id: int,
    db: Session = Depends(get_db),
):
    history = (
        db.query(PassHistory)
        .filter(PassHistory.pass_id == pass_id)
        .order_by(PassHistory.created_at.desc())
        .all()
    )

    return history