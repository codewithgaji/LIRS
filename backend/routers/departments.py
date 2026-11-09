from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.deps import get_current_user, require_admin
from db.session import get_db
from models import Department, User
from schemas import DepartmentCreate, DepartmentOut

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("", response_model=list[DepartmentOut])
def list_departments(
    db: Session = Depends(get_db), _: User = Depends(get_current_user)
) -> list[Department]:
    return list(db.scalars(select(Department).order_by(Department.name)))


@router.post("", response_model=DepartmentOut, status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Department:
    department = Department(name=payload.name, code=payload.code.upper())
    db.add(department)
    db.commit()
    db.refresh(department)
    return department
