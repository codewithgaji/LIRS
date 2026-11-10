# business rules for the register live here so the routers stay short

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
    # format is LIRS/COR/<year>/<running number>, e.g. LIRS/COR/2026/0043
    # I count the letters already registered this year and add 1
    # careful: if a letter is deleted the count drops and a number could repeat
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
    # only adds the row to the session, the router does the commit
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
    # account officers can only open letters assigned to them
    if user.role == AppRole.account_officer and letter.account_officer_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This letter is not assigned to you")


def assert_can_edit(letter: Correspondence, user: User) -> None:
    # admins and managers can edit anything, an officer only their own letters
    if user.role in (AppRole.admin_officer, AppRole.station_manager):
        return
    if letter.account_officer_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This letter is not assigned to you")


def assert_valid_transition(old_status: CorrStatus, new_status: CorrStatus) -> None:
    # STATUS_FLOW lists where a letter may go from its current status,
    # anything else gets a 400 that tells the user what the options are
    allowed = STATUS_FLOW.get(old_status, [])
    if new_status not in allowed:
        allowed_text = ", ".join(s.value for s in allowed) or "no further changes"
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"A letter that is '{old_status.value}' can only move to: {allowed_text}",
        )
