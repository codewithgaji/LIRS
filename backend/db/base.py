# alembic only sees tables that have been imported,
# so I import every model here and alembic/env.py imports this file
from db.session import Base  # noqa: F401
from models import (  # noqa: F401
    Correspondence,
    CorrespondenceStatusHistory,
    Department,
    User,
)
