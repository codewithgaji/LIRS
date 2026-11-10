# LIRS Register: React frontend

Talks only to the FastAPI backend in `../backend` through `src/services/api.js`.

## Run
1. Set up the database and start the API as described in `../backend/README.md`.
2. Start this app:
   ```
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```
3. Open http://localhost:5173 and sign in with `admin@lirs.gov.ng` / `Lirs2026!`

## Folder map
| Folder | Purpose |
|---|---|
| `src/services/api.js` | axios instance, JWT header, one function per endpoint |
| `src/context/AuthContext.jsx` | login, logout, keeps the logged-in user |
| `src/routes/ProtectedRoute.jsx` | blocks pages by login and role |
| `src/components/` | sidebar layout, badges, page header |
| `src/pages/` | one file per screen |
| `src/utils/constants.js` | roles, statuses, workflow, CSV export |

## Request flow
`Page -> services/api.js -> FastAPI router -> service (rules) -> SQLAlchemy model -> PostgreSQL`
