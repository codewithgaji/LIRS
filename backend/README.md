# LIRS Correspondence Register: FastAPI + PostgreSQL backend

FastAPI backend with SQLAlchemy models, Alembic migrations and JWT authentication.
Run every command below from inside the `backend/` folder.

## 1. Requirements

- Python 3.11+
- PostgreSQL 14+ and pgAdmin

## 2. Create the database in pgAdmin

1. Connect to your server, right click Databases, Create, Database.
2. Database name: `lirs_register`, owner `postgres` (or your own role), save.
3. Create the tables with ONE of these:
   - `alembic upgrade head` (recommended), or
   - open the Query Tool on `lirs_register` and run `database/schema.sql`
4. Load sample data: Query Tool on `lirs_register`, run `database/seed_data.sql`.

The seed creates six departments, ten staff accounts and fifty-two letters.
Demo password for every seeded account: `Lirs2026!`

| Email | Role |
| --- | --- |
| admin@lirs.gov.ng | Admin Officer |
| manager@lirs.gov.ng | Station Manager |
| officer@lirs.gov.ng | Account Officer |

## 3. Configure and run

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then edit DATABASE_URL and JWT_SECRET_KEY
alembic upgrade head
uvicorn main:app --reload --port 8000
```

API docs: <http://localhost:8000/docs>

New migration after a model change: `alembic revision --autogenerate -m "describe change"`

## 4. Folder layout

```
main.py                FastAPI app and router registration
core/    config.py     settings from .env
         security.py   bcrypt hashing and JWT create/decode
         deps.py       current user and role guards
db/      session.py    engine, session, Base
         base.py       model imports for alembic
models/                SQLAlchemy models and enums
schemas/               pydantic request/response models
routers/               auth, users, departments, correspondence, reports, admin
services/              business rules (reference numbers, workflow)
alembic/               migrations
database/              schema.sql and seed_data.sql
```

## 5. Roles and permissions

| Capability | Admin Officer | Station Manager | Account Officer |
| --- | --- | --- | --- |
| View register | all letters | all letters | only letters assigned to them |
| Register a new letter | yes | yes | no |
| Assign officers | yes | yes | no |
| Update status | yes | yes | only own letters |
| Edit letter details | yes | yes | remarks only |
| Delete a letter | yes | no | no |
| User management | yes | no | no |
| Database console (read-only SQL) | yes | no | no |

## 6. Workflow rules

Status changes are validated server-side, so a letter cannot jump out of order:

```
pending ──> assigned ──> under_review ──> responded ──> closed
   │            │              │              │
   └──> returned└──> returned  └──> returned  └──> under_review
returned ──> assigned
```

## 7. Main endpoints

All paths are prefixed with `/api/v1`, and every route except `/auth/login`
requires an `Authorization: Bearer <token>` header.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/login` | Sign in, returns JWT + profile |
| GET | `/auth/me` | Current signed-in staff member |
| POST | `/auth/change-password` | Change own password |
| GET/POST | `/users` | List / create staff (create = admin) |
| PATCH | `/users/{id}/role` | Change a staff role (admin) |
| GET/POST | `/departments` | List / create departments |
| GET | `/correspondence` | Search and filter the register |
| POST | `/correspondence` | Register a letter (auto reference number) |
| GET/PATCH/DELETE | `/correspondence/{id}` | Read, edit, delete a letter |
| POST | `/correspondence/{id}/status` | Move the letter through the workflow |
| GET | `/correspondence/{id}/history` | Status-change audit trail |
| GET | `/reports/summary` `/by-status` `/by-department` `/by-officer` `/monthly` | Reporting figures |
| GET | `/admin/schema` | Table and column listing |
| POST | `/admin/query` | Read-only SELECT practice console |
