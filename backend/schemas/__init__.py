from schemas.auth import LoginRequest, TokenResponse
from schemas.correspondence import (
    CorrespondenceCreate,
    CorrespondenceOut,
    CorrespondenceUpdate,
    StatusChangeRequest,
    StatusHistoryOut,
)
from schemas.department import DepartmentCreate, DepartmentOut
from schemas.user import UserCreate, UserOut, UserRoleUpdate, UserUpdate

__all__ = [
    "CorrespondenceCreate",
    "CorrespondenceOut",
    "CorrespondenceUpdate",
    "DepartmentCreate",
    "DepartmentOut",
    "LoginRequest",
    "StatusChangeRequest",
    "StatusHistoryOut",
    "TokenResponse",
    "UserCreate",
    "UserOut",
    "UserRoleUpdate",
    "UserUpdate",
]
