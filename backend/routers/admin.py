# admin only: schema browser and the read-only sql console for the database panel

import re

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from core.deps import require_admin
from db.session import get_db
from models import User

router = APIRouter(prefix="/admin", tags=["Database administration"])

# crude blocklist for anything that could change data, fine for a practice console
# but not real security, the query also has to start with select and have no semicolon
FORBIDDEN = re.compile(
    r"\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|replace|call|set)\b",
    re.IGNORECASE,
)


class SqlQuery(BaseModel):
    sql: str = Field(min_length=6, max_length=4000)


@router.get("/schema")
def list_schema(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> list[dict]:
    rows = db.execute(
        text(
            """
            SELECT table_name, column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = current_schema()
            ORDER BY table_name, ordinal_position
            """
        )
    ).mappings()
    return [dict(row) for row in rows]


@router.post("/query")
def run_readonly_query(
    payload: SqlQuery, db: Session = Depends(get_db), _: User = Depends(require_admin)
) -> dict:
    sql = payload.sql.strip().rstrip(";")
    if not sql.lower().startswith("select"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only SELECT statements are allowed")
    if FORBIDDEN.search(sql) or ";" in sql:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This query contains a forbidden keyword")

    # wrapping the query in a subselect lets me force the 200 row limit
    try:
        rows = db.execute(text(f"SELECT * FROM ({sql}) AS practice LIMIT 200")).mappings()
        return {"rows": [dict(row) for row in rows], "error": None}
    except SQLAlchemyError as exc:
        return {"rows": [], "error": str(exc.__cause__ or exc)}
