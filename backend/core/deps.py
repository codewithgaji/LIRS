# shared dependencies: who is logged in and what they are allowed to do

from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from core.security import decode_access_token
from db.session import get_db
from models import AppRole, User

# auto_error=False so I can send my own 401 message instead of fastapi's default
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")

    payload = decode_access_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")

    # I load the user from the db on every request instead of trusting the role in the token,
    # so a deactivated account or a changed role takes effect straight away
    user = db.get(User, int(payload["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account not found or deactivated")
    return user


def require_roles(*roles: AppRole) -> Callable[[User], User]:
    # this builds a dependency for a list of roles, e.g. require_roles(admin, manager)
    # the inner guard runs get_current_user first, then checks the role
    def guard(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "Your role does not permit this action",
            )
        return current_user

    return guard


require_admin = require_roles(AppRole.admin_officer)
require_manager = require_roles(AppRole.admin_officer, AppRole.station_manager)
