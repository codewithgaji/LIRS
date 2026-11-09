"""Business rules for the register: reference numbers, workflow and access checks."""

from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from models import (
    AppRole,
    Correspondence,
    CorrespondenceStatusHistory,
    CorrStatus,
    User,
)
from models.enums import STATUS_FLOW


def next_reference_number(db: Session) -> str:
    """Generates the next register reference, e.g. LIRS/COR/2026/0043."""
    year = date.today().year
    prefix = f"LIRS/COR/{year}/"
    count = db.scalar(
        select(func.count())
        .select_from(Correspondence)
        .where(Correspondence.reference_number.like(f"{prefix}%"))
    )
    return f"{prefix}{(count or 0) + 1:04d}"


def record_status_change(
    db: Session,
    letter: Correspondence,
    old_status: CorrStatus | None,
    new_status: CorrStatus,
    changed_by: int | None,
    notes: str | None = None,
) -> None:
    db.add(
        CorrespondenceStatusHistory(
            correspondence_id=letter.id,
            old_status=old_status,
            new_status=new_status,
            changed_by=changed_by,
            notes=notes,
        )
    )


def assert_can_view(letter: Correspondence, user: User) -> None:
    """Account Officers only see the letters assigned to them."""
    if user.role == AppRole.account_officer and letter.account_officer_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This letter is not assigned to you")


def assert_can_edit(letter: Correspondence, user: User) -> None:
    if user.role in (AppRole.admin_officer, AppRole.station_manager):
        return
    if letter.account_officer_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This letter is not assigned to you")


def assert_valid_transition(old_status: CorrStatus, new_status: CorrStatus) -> None:
    allowed = STATUS_FLOW.get(old_status, [])
    if new_status not in allowed:
        allowed_text = ", ".join(s.value for s in allowed) or "no further changes"
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"A letter that is '{old_status.value}' can only move to: {allowed_text}",
        )
