"""Imports every model so Alembic autogenerate can see the full metadata."""

from db.session import Base  # noqa: F401
from models import (  # noqa: F401
    Correspondence,
    CorrespondenceStatusHistory,
    Department,
    User,
)
