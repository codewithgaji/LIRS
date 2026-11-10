# database connection: engine, session factory and the get_db dependency

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from core.config import settings

# pool_pre_ping tests a connection before using it, so a restarted postgres
# doesn't leave me with dead connections in the pool
engine = create_engine(settings.database_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    # one session per request, always closed at the end even if the route crashes
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
