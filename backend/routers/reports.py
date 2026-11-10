# numbers behind the dashboard and reports pages

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.deps import get_current_user, require_manager
from db.session import get_db
from models import Correspondence, CorrDirection, CorrStatus, Department, User

router = APIRouter(prefix="/reports", tags=["Reports & analytics"])


@router.get("/summary")
def summary(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> dict:
    total = db.scalar(select(func.count()).select_from(Correspondence)) or 0

    # small helper so each card is one line below
    def count_where(condition) -> int:
        return db.scalar(select(func.count()).select_from(Correspondence).where(condition)) or 0

    return {
        "total": total,
        "incoming": count_where(Correspondence.direction == CorrDirection.incoming),
        "outgoing": count_where(Correspondence.direction == CorrDirection.outgoing),
        "pending": count_where(Correspondence.status == CorrStatus.pending),
        "closed": count_where(Correspondence.status == CorrStatus.closed),
    }


@router.get("/by-status")
def by_status(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[dict]:
    rows = db.execute(
        select(Correspondence.status, func.count()).group_by(Correspondence.status)
    ).all()
    return [{"status": status.value, "count": count} for status, count in rows]


@router.get("/by-department")
def by_department(db: Session = Depends(get_db), _: User = Depends(require_manager)) -> list[dict]:
    # outer join so departments with zero letters still show up with 0
    rows = db.execute(
        select(Department.name, func.count(Correspondence.id))
        .join(Correspondence, Correspondence.department_id == Department.id, isouter=True)
        .group_by(Department.name)
        .order_by(Department.name)
    ).all()
    return [{"department": name, "count": count} for name, count in rows]


@router.get("/by-officer")
def by_officer(db: Session = Depends(get_db), _: User = Depends(require_manager)) -> list[dict]:
    rows = db.execute(
        select(User.full_name, func.count(Correspondence.id))
        .join(Correspondence, Correspondence.account_officer_id == User.id, isouter=True)
        .group_by(User.full_name)
        .order_by(func.count(Correspondence.id).desc())
    ).all()
    return [{"officer": name, "count": count} for name, count in rows]


@router.get("/monthly")
def monthly(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[dict]:
    # to_char is the postgres way to get "2026-03", it replaced mysql date_format
    period = func.to_char(Correspondence.date_received, "YYYY-MM")
    rows = db.execute(
        select(period, func.count()).group_by(period).order_by(period)
    ).all()
    return [{"month": month, "count": count} for month, count in rows]
