# Bug-O-Dex

Bug-O-Dex is a family-oriented bug discovery journal: upload a photo, receive an AI-assisted identification, review the suggestion, and save it to a personal collection. It combines a React client with a Python API, relational persistence, object storage, and multimodal model integration.

**Status: core product workflow implemented; production operation unverified.** This README was checked against source commit [`2374e5a`](https://github.com/rl-hicks/bug-o-dex/tree/2374e5a92678e9a20bf4db7161fc1dafa5e0dcaf) (June 19, 2026) on October 16, 2026. “Implemented” below means present in the source, not independently tested end to end against live services.

## Implemented experience

1. Log in with an existing account. Registration is available through the API; there is no signup page.
2. Select a JPEG, PNG, or WebP photo, preview it, and add approximate location/context, an optional date, and optional notes.
3. Upload the image to Supabase Storage and send its URL and discovery context to OpenAI for identification.
4. Review the suggested name, category, description, confidence note, safety note, and best-guess disclaimer. The review screen supports another identification request using the uploaded image.
5. Explicitly save the result, then browse, view, edit, or delete entries in the authenticated user's collection. Entries are not publicly listed by default.

Logged-out visitors can browse a read-only example collection drawn from one configured user's explicitly public entries. A contact form stores messages, and an admin page exposes those messages plus event counts and event-table storage usage.

## Architecture and stack

| Layer | Implementation | Source |
| --- | --- | --- |
| Web client | React 19, TypeScript, Vite 8, React Router; typed API helpers using `fetch` | [`frontend/src`](frontend/src), [`package.json`](frontend/package.json) |
| API | FastAPI, Pydantic request/response models, dependency-based authentication | [`backend/app`](backend/app) |
| Persistence | PostgreSQL, SQLAlchemy 2, psycopg, Alembic migrations | [`models`](backend/app/models), [`migrations`](backend/alembic/versions) |
| Authentication | bcrypt password hashes; expiring JWT bearer tokens | [`auth.py`](backend/app/auth.py), [`dependencies.py`](backend/app/dependencies.py) |
| Image storage | Supabase Storage; user-prefixed paths with UUID filenames | [`uploads.py`](backend/app/routers/uploads.py) |
| AI identification | OpenAI Responses API, `gpt-4.1-mini`, strict JSON Schema output and Pydantic validation | [`identify.py`](backend/app/routers/identify.py) |
| Local infrastructure | Docker Compose runs PostgreSQL 17; API and frontend run separately | [`docker-compose.yml`](docker-compose.yml) |

The browser calls FastAPI for authentication, uploads, identification, and collection operations. FastAPI writes metadata to PostgreSQL, image bytes to Supabase Storage, and sends the image URL and context to OpenAI. Provider credentials stay on the backend; the browser receives the image URL and identification result.

### Engineering decisions visible in the code

- **Separate upload, identify, and save operations.** The UI keeps the uploaded URL for identification retries and requires an explicit save before creating a database entry. See [`UploadPage.tsx`](frontend/src/pages/UploadPage.tsx).
- **Bounded model output.** Identification requests require six string fields with no additional properties. The prompt asks for cautious, child-friendly best guesses and observation-without-touching advice. Schema validation constrains the response shape, not identification accuracy.
- **Server-side ownership checks.** Collection reads, updates, and deletes filter by authenticated user ID. Admin routes additionally require an exact `ADMIN_USER_ID` match; this is a single-account gate, not a role-management system.
- **Explicit public projection.** Public endpoints require both `is_public=true` and the configured `PUBLIC_VAULT_USER_ID`. Responses omit account IDs, location context, and the private identification fields.
- **Upload limits.** The API accepts declared JPEG/PNG/WebP MIME types and reads in chunks while enforcing `MAX_UPLOAD_BYTES` (10,485,760 bytes / 10 MiB by default).
- **Versioned relational data.** Four migrations define users, owned bug entries, publication flags, contact messages, and JSONB event metadata. Event logging is best-effort: failures are rolled back and suppressed rather than failing the completed business operation.

## Scope and limitations

| Area | Current boundary |
| --- | --- |
| Accounts | Registration, login, and `/auth/me` exist. Registration has no UI and defaults to disabled in production. No password reset, refresh-token flow, or profile editor is implemented. The frontend stores access tokens in `localStorage`. |
| Public sharing | Public browsing exists. Setting `is_public` is supported by the create/update API but has no UI control; only one configured account supplies the public collection. |
| Images | Collection access controls do **not** make image URLs private. The upload flow expects a public bucket. File validation checks declared MIME type and byte count, not decoded image contents. Deleting an entry does not delete the stored image; abandoned uploads are not cleaned up. |
| AI workflow | Notes inform identification but are not persisted as a separate journal field. No accuracy evaluation suite, usage quotas, or cost/latency instrumentation is included. The synchronous provider call runs inside an async route; there is no background job queue. |
| Operations | Event logging covers selected actions, not a complete audit trail. There is no application-level rate limiting or list pagination. The admin storage percentage uses a fixed 0.5 GiB reference, not a verified hosting quota. |
| Product scope | Badges, rarity systems, maps, quests, and richer user profiles remain unimplemented. |
| Verification | No automated test suite or CI workflow is checked in. Runtime behavior, performance, and production reliability have not been independently established by this documentation review. |

## Local development

### Prerequisites

- Python with `venv` and `pip`; the repository does not pin a Python interpreter version.
- Node.js matching `^20.19.0 || >=22.12.0` and npm, as declared in `frontend/package.json`.
- Docker with Docker Compose for the local PostgreSQL service.
- A Supabase project with a **public** Storage bucket (default name: `bug-images`) and a backend credential authorized to upload to it.
- An OpenAI API key with access to the configured `gpt-4.1-mini` model for real identification requests.

Commands below use Bash, including WSL. Docker Compose starts only the database; it does not provision storage, credentials, or application processes.

### 1. Start PostgreSQL

```bash
git clone https://github.com/rl-hicks/bug-o-dex.git
cd bug-o-dex
docker compose up -d
```

PostgreSQL listens on port `5432` and persists data in the `postgres_data` volume. The credentials in Compose are for local development.

### 2. Configure and start the API

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Create `backend/.env` with the following values, replacing the credential placeholders. Generate a signing secret with `python -c 'import secrets; print(secrets.token_urlsafe(32))'`.

```dotenv
APP_ENV=development
DATABASE_URL=postgresql+psycopg://bugodex:bugodex@localhost:5432/bugodex
CORS_ORIGINS=http://localhost:5173
SECRET_KEY=replace-with-generated-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=replace-with-backend-storage-credential
SUPABASE_BUCKET_NAME=bug-images
MAX_UPLOAD_BYTES=10485760
OPENAI_API_KEY=replace-with-openai-api-key
```

Settings load `.env` from the working directory, so run the API from `backend/`. The external-service settings are required by configuration even if you only use account or collection endpoints. Keep secrets out of Git and out of frontend `VITE_*` variables.

Optional settings, also placed in `backend/.env`:

| Variable | Behavior |
| --- | --- |
| `PUBLIC_VAULT_USER_ID` | UUID of an existing user whose public entries appear in the example collection. Omit until configured; do not leave it as an empty value. |
| `ADMIN_USER_ID` | UUID of the existing account allowed to access admin endpoints. Omit to grant no admin access. The root `.env.example` mentions this variable, but the API reads `backend/.env` when started as above. |
| `REGISTRATION_ENABLED` | Defaults to `false`; enables registration in production when set to `true`. Development permits registration regardless of this flag. |

[`backend/.env.example`](backend/.env.example) lists most settings, but its blank `PUBLIC_VAULT_USER_ID=` must be removed or replaced with a valid user UUID if you copy that template. CORS origins are comma-separated.

Apply the schema, then start the API:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

The API is at `http://localhost:8000`; development API documentation is at `http://localhost:8000/docs`. Use `POST /auth/register` there to create a local account with an email, password of at least eight characters, and optional display name. Then log in through the frontend. To configure admin/public access, obtain the account UUID from authenticated `GET /auth/me`, update the optional settings, and restart the API.

### 3. Start the frontend

In another terminal, from the repository root:

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

The template sets `VITE_API_BASE_URL=http://localhost:8000`. Open `http://localhost:5173`. If Vite selects another port, update the backend CORS setting to match.

### Checks and API navigation

```bash
curl http://localhost:8000/health
curl http://localhost:8000/db-check
```

`/health` returns `{"status":"ok"}` without checking dependencies. `/db-check` executes `SELECT 1`; neither checks storage or OpenAI. From `frontend/`, `npm run lint` and `npm run build` provide lint and TypeScript/production-build checks; they are not end-to-end tests.

| API group | Routes |
| --- | --- |
| Accounts | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Discovery | `POST /uploads` (multipart `file`), `POST /identify` |
| Owned collection | `GET/POST /bug-entries`, `GET/PATCH/DELETE /bug-entries/{id}` |
| Public collection | `GET /public/bug-entries`, `GET /public/bug-entries/{id}` |
| Contact | `POST /contact-messages` |
| Administration | `GET /admin/status`, `GET /admin/contact-messages`, `GET /admin/event-summary` |

Discovery, owned collection, and `/auth/me` require a bearer token; admin routes also require the configured admin account. To manually exercise the core workflow, register locally, log in, upload and identify a photo, save it, then view, edit, and delete the entry. This requires real storage and model credentials and can incur provider charges.

## Deployment evidence

[`frontend/vercel.json`](frontend/vercel.json) contains a Vercel SPA rewrite. Existing frontend copy describes an E1 deployed build, references Render for the API, and mentions Neon for database inspection. Those are repository statements, not independent confirmation of the current hosting configuration or service health.

The backend has production-specific behavior: `APP_ENV=production` hides OpenAPI documentation and `/db-check`, and disables registration unless explicitly enabled. There is no checked-in backend deployment manifest or automated deployment workflow. Current deployment availability, credentials, database migrations, and the complete production user journey remain unverified; no uptime, throughput, accuracy, or latency claims are made here.
