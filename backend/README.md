# Dentify API — Backend

FastAPI backend for DentApp, following the RBAC model in
`dentapp-architecture-v2.md` (roles: patient, receptionist, dentist, owner —
permissions split by data category, not just by role).

## Project structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, router wiring, health check
│   ├── core/                # cross-cutting concerns (not request handlers)
│   │   ├── config.py        # Settings (env vars)
│   │   ├── database.py      # async engine, session, Base
│   │   ├── security.py      # password hashing, JWT create/decode
│   │   ├── permissions.py   # Role / Category enums + read/write matrices
│   │   └── deps.py          # get_current_user, require_read/write, etc.
│   ├── models/               # SQLAlchemy ORM models (one file per entity)
│   │   ├── __init__.py       # imports every model so Base.metadata is complete
│   │   ├── base.py           # UUIDPKMixin, TimestampMixin
│   │   ├── user.py, patient.py, dentist.py, staff.py, resource.py,
│   │   ├── appointment.py, treatment.py, invoice.py, lead.py,
│   │   ├── message.py, document.py, referral.py, audit_log.py
│   ├── schemas/              # Pydantic request/response models
│   │   ├── auth.py
│   │   └── patient.py
│   ├── api/v1/                # one router file per resource
│   │   ├── __init__.py        # api_router aggregator, included by main.py
│   │   ├── auth.py            # login / refresh / me (fully implemented)
│   │   ├── patients.py        # full CRUD example — copy this pattern
│   │   └── ...                # other resources: minimal GET stub + TODOs
│   └── services/              # business logic that doesn't belong in routers
│                               # (empty for now — e.g. future storage_service.py)
├── alembic/                   # DB migrations (autogenerate against app.models)
│   ├── env.py
│   └── versions/
├── alembic.ini
├── tests/
│   └── test_health.py
├── seed.py                    # creates the first owner account
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

### Why this layout

- **`core/` vs `models/` vs `api/`** keeps three different concerns apart:
  config/security/db-plumbing, the data model, and the HTTP layer. This
  mirrors what your `deps.py`/`permissions.py` already assumed (they import
  from `app.core.*` and `app.models.*`), so no code changes were needed —
  the files just needed to move into that package layout.
- **One router file per resource** under `api/v1/` keeps each domain's
  endpoints small and lets you delete/replace a whole resource without
  touching others. `api/v1/__init__.py` is the single place that wires them
  into the app.
- **`schemas/` separate from `models/`** — SQLAlchemy models describe what's
  stored; Pydantic schemas describe what's accepted/returned over HTTP.
  Keeping them apart means you can hide fields (e.g. `password_hash`,
  `notes_private`) from API responses without touching the ORM model.

## What was missing / added

1. **`app/main.py`** — didn't exist. Creates the FastAPI app, wires CORS from
   `settings.CORS_ORIGINS`, mounts the v1 router under
   `settings.API_V1_PREFIX`, and adds `/` + `/health` checks.
2. **`app/models/referral.py`** — `Patient.referrals` referenced a `Referral`
   model that was never defined anywhere in the zip. Added it based on the
   description in `dentapp-architecture-v2.md` section 12/13 (external
   referral to a non-platform specialist: free text + practitioner name).
   Without this file, SQLAlchemy would fail at mapper-configuration time with
   `InvalidRequestError: expression 'Referral' failed to locate a name`.
3. **`app/api/v1/*`** — no router/endpoint files existed at all (only ORM
   models + auth plumbing). Added:
   - `auth.py` — fully working `/login`, `/refresh`, `/me`.
   - `patients.py` — a complete worked example (list/create/get/update, plus
     a separate `/clinical` sub-resource gated by `Category.CLINICAL_READ` /
     `CLINICAL_WRITE`) — **use this as the template** for the other routers.
   - The rest (`appointments`, `treatments`, `invoices`, `dentists`, `staff`,
     `resources`, `leads`, `messages`, `documents`, `referrals`,
     `audit_logs`) are minimal `GET` list endpoints with the right
     permission category already wired, and `TODO` comments pointing at the
     relevant architecture-doc section for what to build next.
4. **`app/schemas/*`** — Pydantic request/response models (only `auth` and
   `patient` written in full; add one per resource as you flesh out its
   router).
5. **`alembic/` + `alembic.ini`** — migrations were referenced by
   `docker-compose.yml` (`./alembic:/code/alembic`) but didn't exist.
   `env.py` is wired to `app.core.config.settings` and imports `app.models`
   so `alembic revision --autogenerate` picks up every table.
6. **`seed.py`** — `config.py` already had `SEED_OWNER_EMAIL` /
   `SEED_OWNER_PASSWORD` settings with nothing that used them. This script
   creates that first owner account (with its `StaffProfile`) so you have a
   way to log in before any other users exist.
7. **`.gitignore`**, **`tests/test_health.py`**, **`uploads/.gitkeep`** — basic
   hygiene files that were missing.

## Running it

```bash
cp .env.example .env      # adjust secrets before anything but local dev
docker compose up --build
```

Then, in a separate shell, run migrations and seed the owner account:

```bash
docker compose exec backend alembic revision --autogenerate -m "init"
docker compose exec backend alembic upgrade head
docker compose exec backend python seed.py
```

API docs: `http://localhost:8000/api/v1/docs`

## Next steps

- Flesh out the stub routers in `app/api/v1/` (start with `appointments.py`
  — it's the most involved, per architecture section 4).
- Add a `schemas/` file per resource as you go.
- Consider a `services/` layer once routers start doing more than simple
  CRUD (e.g. appointment double-booking checks, invoice/payment-plan math).
