# Bug-O-Dex

## Overview

Bug-O-Dex is a family-facing web application where a child, with parent assistance, uploads a real bug photo, receives an AI-assisted identification, and builds a collectible field-journal / Pokédex-style collection.

Current project phase:

**E0 — Engineering Foundation**

The goal of E0 is to establish a clean, repeatable development environment before building product features.

---

## Current Status

Implemented:

* PostgreSQL database
* FastAPI backend
* React frontend
* Frontend ↔ backend communication
* Backend ↔ database connectivity
* Local development environment
* Docker-based database runtime

Not yet implemented:

* Authentication
* Image upload pipeline
* AI bug identification
* Collection management
* User profiles
* Badges
* Rarity systems
* Maps
* Quests
* Production deployment

---

## Stack

### Frontend

* React
* TypeScript
* Vite

### Backend

* Python
* FastAPI
* SQLAlchemy

### Database

* PostgreSQL

### Infrastructure

* Docker Compose
* GitHub

---

## Local Development

### Start Database

From repository root:

```bash
docker compose up -d
```

---

### Start Backend

```bash
cd backend

source .venv/bin/activate

uvicorn app.main:app --reload
```

Backend runs on:

```text
http://localhost:8000
```

---

### Start Frontend

```bash
cd frontend

npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

## Environment Variables

### Backend

Create:

```text
backend/.env
```

Required values:

```env
APP_ENV=development
DATABASE_URL=postgresql+psycopg://bugodex:bugodex@localhost:5432/bugodex
CORS_ORIGINS=http://localhost:5173
```

Reference template:

```text
backend/.env.example
```

---

### Frontend

Create:

```text
frontend/.env
```

Required values:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Reference template:

```text
frontend/.env.example
```

---

## Current Endpoints

### Health Check

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

---

### Database Check

```http
GET /db-check
```

Response:

```json
{
  "database": "connected"
}
```

---

## Deployment Direction

Initial deployment direction:

- Frontend: Vercel
- Backend: Render
- Database: Render PostgreSQL
- Image storage later: Cloudflare R2 or S3-compatible object storage

E0 does not require production deployment. The goal is to choose a likely path so future deployment decisions do not block E1.

---

## E0 Completion Goal

The E0 phase is complete when:

* Frontend runs locally
* Backend runs locally
* Database runs locally
* Backend can connect to database
* Frontend can connect to backend
* Environment variables are documented
* Development setup is repeatable

After E0, development moves into E1 where the core Bug-O-Dex product loop will be implemented:

```text
Upload photo
→ AI identification
→ Save entry
→ Display collection
```
