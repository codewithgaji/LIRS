# LIRS Correspondence Register Management System

A digital replacement for the manual correspondence register at the Lagos State Internal
Revenue Service (LIRS). It records every letter that enters or leaves the station, assigns
it to staff, tracks it through a fixed workflow and gives searchable reports, with
role-based access and a full audit trail.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, React Router, axios, Recharts (folder `frontend/`) |
| Backend | FastAPI, SQLAlchemy 2, Alembic (folder `backend/`) |
| Database | PostgreSQL |
| Auth | JWT bearer tokens signed with `JWT_SECRET_KEY`, bcrypt password hashes |

## Roles

- Admin Officer: everything, including user management and the database panel
- Station Manager: register, assign and update letters, view reports
- Account Officer: only the letters assigned to them

## Workflow

```text
pending -> assigned -> under_review -> responded -> closed
   |           |             |             |
   +-> returned+-> returned  +-> returned   +-> under_review
returned -> assigned
```

## Project layout

```text
backend/    FastAPI app, models, routers, alembic/, database/ (schema.sql, seed_data.sql), .env
frontend/   React app, .env
```

Each folder has its own README and its own `.env` (copy it from `.env.example`).
The `.env` files are never committed.

## Quick start

1. In pgAdmin create a database named `lirs_register`.
2. Backend (see `backend/README.md`):
   ```sh
   cd backend
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env        # fill in DATABASE_URL and JWT_SECRET_KEY
   alembic upgrade head
   uvicorn main:app --reload --port 8000
   ```
3. Load the sample data: in pgAdmin open the Query Tool on `lirs_register` and run `backend/database/seed_data.sql`.
4. Frontend:
   ```sh
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```
5. Open http://localhost:5173 and sign in with `admin@lirs.gov.ng` / `Lirs2026!`.
