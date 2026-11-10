from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from core.deps import get_current_user, require_admin, require_manager
from db.session import get_db
from models import AppRole, Correspondence, CorrStatus, User
from models.correspondence import CorrespondenceStatusHistory
from schemas import (
    CorrespondenceCreate,
    CorrespondenceOut,
    CorrespondenceUpdate,
    StatusChangeRequest,
    StatusHistoryOut,
)
from services.correspondence_service import (
    assert_can_edit,
    assert_can_view,
    assert_valid_transition,
    next_reference_number,
    record_status_change,
)

router = APIRouter(prefix="/correspondence", tags=["Correspondence register"])


@router.get("", response_model=list[CorrespondenceOut])
def list_correspondence(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: str | None = Query(default=None, description="Matches reference, title or company"),
    # called status_filter in python because "status" is already the fastapi import,
    # the alias keeps the url param as ?status=
    status_filter: CorrStatus | None = Query(default=None, alias="status"),
    officer_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = Query(default=100, le=500),
    offset: int = 0,
) -> list[Correspondence]:
    stmt = select(Correspondence).order_by(Correspondence.date_received.desc())

    # account officers only ever see their own letters, so I filter here
    if current_user.role == AppRole.account_officer:
        stmt = stmt.where(Correspondence.account_officer_id == current_user.id)

    if search:
        # ilike because postgres LIKE is case sensitive and I want search to ignore case
        pattern = f"%{search}%"
        stmt = stmt.where(
            or_(
                Correspondence.reference_number.ilike(pattern),
                Correspondence.letter_title.ilike(pattern),
                Correspondence.company_name.ilike(pattern),
            )
        )
    if status_filter:
        stmt = stmt.where(Correspondence.status == status_filter)
    if officer_id:
        stmt = stmt.where(Correspondence.account_officer_id == officer_id)
    if date_from:
        stmt = stmt.where(Correspondence.date_received >= date_from)
    if date_to:
        stmt = stmt.where(Correspondence.date_received <= date_to)

    return list(db.scalars(stmt.limit(limit).offset(offset)))


@router.post("", response_model=CorrespondenceOut, status_code=status.HTTP_201_CREATED)
def create_correspondence(
    payload: CorrespondenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
) -> Correspondence:
    # a letter with an officer starts as assigned, otherwise it waits as pending
    letter = Correspondence(
        **payload.model_dump(),
        reference_number=next_reference_number(db),
    )
    letter.status = CorrStatus.assigned if payload.account_officer_id else CorrStatus.pending
    if letter.admin_officer_id is None and current_user.role == AppRole.admin_officer:
        letter.admin_officer_id = current_user.id

    db.add(letter)
    # flush gives the letter its id so the history row can point at it, commit comes after
    db.flush()
    record_status_change(db, letter, None, letter.status, current_user.id, "Letter registered")
    db.commit()
    db.refresh(letter)
    return letter


@router.get("/{letter_id}", response_model=CorrespondenceOut)
def get_correspondence(
    letter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Correspondence:
    letter = db.get(Correspondence, letter_id)
    if letter is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Letter not found")
    assert_can_view(letter, current_user)
    return letter


@router.patch("/{letter_id}", response_model=CorrespondenceOut)
def update_correspondence(
    letter_id: int,
    payload: CorrespondenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Correspondence:
    letter = db.get(Correspondence, letter_id)
    if letter is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Letter not found")
    assert_can_edit(letter, current_user)

    changes = payload.model_dump(exclude_unset=True)
    if current_user.role == AppRole.account_officer:
        # an officer can only add remarks, I drop every other field so she can't reassign the letter
        changes = {k: v for k, v in changes.items() if k == "remarks"}

    for field, value in changes.items():
        setattr(letter, field, value)
    db.commit()
    db.refresh(letter)
    return letter


@router.post("/{letter_id}/status", response_model=CorrespondenceOut)
def change_status(
    letter_id: int,
    payload: StatusChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Correspondence:
    letter = db.get(Correspondence, letter_id)
    if letter is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Letter not found")
    assert_can_edit(letter, current_user)
    # stop here if the jump is not allowed by the workflow
    assert_valid_transition(letter.status, payload.new_status)

    old_status = letter.status
    letter.status = payload.new_status
    record_status_change(db, letter, old_status, payload.new_status, current_user.id, payload.notes)
    db.commit()
    db.refresh(letter)
    return letter


@router.get("/{letter_id}/history", response_model=list[StatusHistoryOut])
def get_history(
    letter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CorrespondenceStatusHistory]:
    letter = db.get(Correspondence, letter_id)
    if letter is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Letter not found")
    assert_can_view(letter, current_user)
    return list(letter.history)


@router.delete("/{letter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_correspondence(
    letter_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)
) -> None:
    letter = db.get(Correspondence, letter_id)
    if letter is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Letter not found")
    db.delete(letter)
    db.commit()
