# LIRS Correspondence Register Management System

A digital replacement for the manual correspondence register used at the Lagos State
Internal Revenue Service (LIRS). Built as a coursework project for **CSA 392 — Computer
Work Experience Scheme (CWES)**.

The system records every letter that enters or leaves the station, assigns it to staff,
tracks its progress through a defined workflow, and produces searchable reports and
analytics — with role-based access control and a full audit trail.

## Features

- **Authentication & roles** — email/password sign-in with three roles:
  - *Admin Officer* — full access, including User Management and the Database Admin panel
  - *Station Manager* — register, assign and update correspondence; view reports
  - *Account Officer* — view and update only the letters assigned to them
- **Dashboard** — totals, status breakdown, six-month volume trend, officer workload and recent activity
- **Register Correspondence** — validated entry form with auto-generated reference numbers (`LIRS/COR/YYYY/0001`)
- **Correspondence detail** — edit, reassign, move through the workflow, and view the full status history timeline
- **Search** — keyword, status, officer and date-range filters with pagination and CSV export
- **Reports** — daily, monthly, departmental, officer and status reports with CSV and print/PDF output
- **Analytics** — status distribution, twelve-month volume, workload and departmental charts
- **User Management** — create staff accounts, change roles, activate/deactivate staff (Admin Officer only)
- **Database Admin** — schema browser and a read-only SQL console for demonstrating query skills (Admin Officer only)
- **Settings** — account details, permission summary and password change

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TanStack Start (routing + SSR), TanStack Query, Tailwind CSS v4, Recharts |
| Backend | TanStack server functions (typed RPC) running on the edge runtime |
| Database | PostgreSQL with Row-Level Security, SQL functions and triggers |
| Auth | Email/password sessions with JWT bearer tokens, bcrypt-hashed passwords |

> The original brief specified FastAPI + MySQL. The system is implemented on the
> Lovable Cloud stack instead — React on the front end, typed server functions on the
> back end and PostgreSQL for storage. The architecture is equivalent: schema-first
> database design, validated request payloads (Zod, the Pydantic equivalent),
> role-guarded endpoints and a relational data model with foreign keys, enums,
> constraints and triggers.

## Database design

**Enumerated types**

- `app_role` — `admin_officer`, `station_manager`, `account_officer`
- `corr_status` — `pending`, `assigned`, `under_review`, `responded`, `closed`, `returned`
- `corr_priority` — `low`, `normal`, `high`, `urgent`
- `corr_direction` — `incoming`, `outgoing`

**Tables**

| Table | Purpose | Key columns |
| --- | --- | --- |
| `departments` | Revenue units letters are routed to | `name`, `code` |
| `profiles` | Staff records, linked to a login on first sign-in | `user_id`, `full_name`, `email`, `intended_role`, `department_id`, `station`, `is_active` |
| `user_roles` | Role grants, stored separately from profiles to prevent privilege escalation | `user_id`, `role` |
| `correspondence` | The register itself | `reference_number`, `direction`, `date_received`, `letter_title`, `company_name`, `contact_phone`, `priority`, `status`, `admin_officer_id`, `station_manager_id`, `account_officer_id`, `department_id`, `remarks` |
| `correspondence_status_history` | Audit trail of every status change | `correspondence_id`, `old_status`, `new_status`, `changed_by`, `notes`, `changed_at` |

**Functions and triggers**

- `has_role(_user_id, _role)` — `SECURITY DEFINER` role check used by every RLS policy
- `current_profile_id()` — maps the signed-in user to their staff profile
- `set_reference_number()` — generates the next `LIRS/COR/YYYY/NNNN` reference on insert
- `log_status_change()` — writes an audit row on insert and on every status change
- `set_updated_at()` — maintains the `updated_at` timestamp
- `exec_readonly_sql(query_text)` — service-role-only helper behind the Database Admin console; rejects anything other than a single `SELECT`

**Security**

Row-Level Security is enabled on every table. Staff can read the register; Admin Officers
and Station Managers can insert and update letters; Account Officers can update only the
letters assigned to them; Admin Officers alone manage staff, departments and deletions.

## Workflow

```text
pending ──► assigned ──► under_review ──► responded ──► closed
   ▲            │              │              │            │
   └──────── returned ◄────────┴──────────────┘            │
                                   under_review ◄──────────┘
```

## Sample data

The database ships with six departments, ten staff records and 52 realistic letters
spread across statuses, priorities and dates.

Demo staff emails (sign up with one of these addresses to claim the matching role):

| Email | Role |
| --- | --- |
| `admin@lirs.gov.ng` | Admin Officer |
| `manager@lirs.gov.ng` | Station Manager |
| `officer@lirs.gov.ng` | Account Officer |

## Project structure

```text
src/
  routes/
    __root.tsx                  shared layout, providers, fonts
    index.tsx                   redirects to the dashboard
    auth.tsx                    sign-in / sign-up
    _authenticated/
      route.tsx                 auth gate + application shell
      dashboard.tsx
      register.tsx
      search.tsx
      correspondence.$id.tsx
      reports.tsx
      analytics.tsx
      users.tsx
      database.tsx
      settings.tsx
  components/                   shell, page header, status badges, UI primitives
  lib/
    constants.ts                roles, statuses, priorities, workflow rules
    auth.tsx                    session + profile context and permission hooks
    queries.ts                  database reads and CSV export helpers
    account.functions.ts        server function: resolve/claim the staff profile
    admin.functions.ts          server functions: schema, read-only SQL, staff admin
  integrations/supabase/        generated database clients and auth middleware
supabase/migrations/            versioned SQL schema and seed data
```

## Running locally

```sh
npm install
npm run dev
```

The application starts on <http://localhost:8080>.
