# LIRS Correspondence Register — FastAPI + MySQL backend

This folder holds the Python backend required by the CSA 392 project brief:
**React frontend + FastAPI backend + MySQL database (SQLAlchemy + Alembic)**.

It does not run inside the Lovable preview (that environment has no Python or
MySQL). Clone the repository and run it locally as shown below.

## 1. Requirements

- Python 3.11+
- MySQL 8.0 running locally

## 2. Create the database

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p lirs_register < database/seed_data.sql
```

This creates six departments, ten staff accounts and fifty-two sample letters.
**Demo password for every seeded account: `Lirs2026!`**

| Email | Role |
| --- | --- |
| admin@lirs.gov.ng | Admin Officer |
| manager@lirs.gov.ng | Station Manager |
| officer@lirs.gov.ng | Account Officer |

## 3. Install and run the API

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env        # then edit DATABASE_URL and JWT_SECRET_KEY
uvicorn backend.main:app --reload --port 8000
```

Interactive API documentation: <http://localhost:8000/docs>

### Alembic (schema migrations)

`database/schema.sql` and Alembic describe the same schema — use either one.

```bash
alembic upgrade head          # apply migrations
alembic revision --autogenerate -m "describe change"
```

## 4. Folder layout

```
backend/
  main.py                  FastAPI application and router registration
  core/     config.py      settings from environment variables
            security.py    bcrypt hashing + JWT create/decode
            deps.py        current-user dependency and role guards
  db/       session.py     SQLAlchemy engine, session, declarative Base
            base.py        metadata import for Alembic
  models/                  SQLAlchemy ORM models + domain enums
  schemas/                 Pydantic request/response models
  routers/  auth.py        login, /me, change password
            users.py       staff CRUD and role changes (admin only)
            departments.py department list/create
            correspondence.py  register CRUD, workflow, history
            reports.py     dashboard, analytics and report figures
            admin.py       schema browser + read-only SQL console
  services/                business rules (reference numbers, workflow)
alembic/                   migration environment and versions
database/schema.sql        full MySQL DDL, triggers and reporting view
database/seed_data.sql     realistic sample data
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

## 8. Connecting the React frontend

The React app in `src/` currently talks to the Lovable Cloud backend so the live
preview keeps working. To point it at this API instead, set a base URL of
`http://localhost:8000/api/v1`, store the JWT returned by `/auth/login`, and send
it as a bearer token on every request.
