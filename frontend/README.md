# LIRS Register — React (JavaScript) frontend

Talks only to the FastAPI backend in `../backend` via `src/services/api.js`.

## Run
1. Start MySQL and load the data: `mysql -u root -p < database/schema.sql` then `mysql -u root -p lirs_register < database/seed_data.sql`
2. Start the API from the project root: `pip install -r backend/requirements.txt` then `uvicorn backend.main:app --reload --port 8000`
3. Start this app:
   ```
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```
4. Open http://localhost:5173 and sign in with `admin@lirs.gov.ng` / `Lirs2026!`

## Folder map
| Folder | Purpose |
|---|---|
| `src/services/api.js` | axios instance, JWT header, one function per FastAPI endpoint |
| `src/context/AuthContext.jsx` | login / logout, keeps the logged-in user |
| `src/routes/ProtectedRoute.jsx` | blocks pages by login and role |
| `src/components/` | sidebar layout, badges, page header |
| `src/pages/` | Login, Dashboard, Correspondence list/search, Register, Letter detail, Reports, Users, Database panel, Settings |
| `src/utils/constants.js` | roles, statuses, workflow, CSV export |

## Request flow
`Page → services/api.js → FastAPI router → service (rules) → SQLAlchemy model → MySQL`
