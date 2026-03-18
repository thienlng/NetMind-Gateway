# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a pnpm workspace monorepo containing multiple applications (artifacts) and shared libraries. The project uses TypeScript 5.9, Node.js 24, and includes a Python FastAPI backend component.

**Stack:**
- Monorepo: pnpm workspaces
- TypeScript: 5.9 with composite projects
- Backend (Python): FastAPI + SQLAlchemy + PostgreSQL
- Frontend: React 19 + Vite + Tailwind CSS v4 + React Query
- Validation: Zod v4, drizzle-zod
- API codegen: Orval from OpenAPI spec

## Common Commands

### Root-level commands
```bash
pnpm run build          # Typecheck then build all packages
pnpm run typecheck      # Run tsc --build for all project references
```

### Running development servers
```bash
# CRM Frontend
pnpm --filter @workspace/crm-frontend run dev

# Python CRM Backend (from root)
uv run python artifacts/crm-backend/main.py
```

### Database operations
```bash
# Push schema changes (development)
pnpm --filter @workspace/db run push

# Force push schema (use with caution)
pnpm --filter @workspace/db run push-force
```

### API code generation
When the OpenAPI spec (`lib/api-spec/openapi.yaml`) changes, regenerate clients:
```bash
pnpm --filter @workspace/api-spec run codegen
```
This generates:
- React Query hooks → `lib/api-client-react/src/generated/`
- Zod schemas → `lib/api-zod/src/generated/`

## Architecture

### Workspace Structure
```
├── artifacts/          # Deployable applications
│   ├── crm-backend/    # FastAPI CRM backend (Python)
│   └── crm-frontend/   # React CRM frontend
├── lib/                # Shared libraries
│   ├── api-spec/       # OpenAPI spec + Orval config
│   ├── api-client-react/ # Generated React Query hooks
│   ├── api-zod/        # Generated Zod schemas
│   └── db/             # Drizzle ORM schema + connection
└── scripts/            # Utility scripts
```

### TypeScript Composite Projects
All packages extend `tsconfig.base.json` with `composite: true`. The root `tsconfig.json` defines project references. **Always typecheck from the root** with `pnpm run typecheck` — running `tsc` inside a single package will fail if dependencies haven't been built.

### Package Naming
All packages use the `@workspace/` scope (e.g., `@workspace/db`).

### Database Layer (`lib/db`)
- Exports Drizzle client (`db`) and PostgreSQL pool from `src/index.ts`
- Schema definitions in `src/schema/` — each table gets its own file
- Uses `drizzle-zod` for insert schemas
- Requires `DATABASE_URL` environment variable

### CRM Backend (Python)
FastAPI application at `artifacts/crm-backend/` with:
- SQLAlchemy models in `app/models.py`
- Routers in `app/routers/` for auth, users, models, projects, keys
- Default admin user created on startup: `admin` / `admin123`
- API docs at `/crm-api/docs`

### CRM Frontend
React 19 app using:
- Wouter for routing
- Radix UI primitives
- React Hook Form + Zod for form validation
- React Query for data fetching (hooks from `@workspace/api-client-react`)

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (required by `@workspace/db`)

### Frontend Runtime Configuration
The frontend uses a `window.__ENV__` injection pattern instead of build-time variables (like `import.meta.env`).
In production/Docker, this is handled by Nginx which intercepts the request for `env-config.js` and injects the runtime variables:
```nginx
# Server inline env-config.js at /crm/env-config.js
location = /crm/env-config.js {
    add_header Content-Type "application/javascript; charset=utf-8";
    return 200 'window.__ENV__ = { "API_BASE": "${VITE_API_BASE}" };';
}
```
In `api.ts`, API_BASE is resolved as: `window.__ENV__.API_BASE → import.meta.env.VITE_API_BASE → "/api"`. This enables building the Docker image once and configuring it dynamically per environment via `VITE_API_BASE` without rebuilding.

## Python Setup

Python dependencies are managed with `uv`. The `pyproject.toml` at root defines the Python workspace with FastAPI, SQLAlchemy, and related packages.