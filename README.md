# Sakuta

Sakuta is a React/Vite personal finance application using Supabase for backend services and database access.

## Repository layout

- `frontend/` contains the Vite app, feature code, shared UI, mobile-specific components, contexts, store, and utilities.
- `backend/` is reserved for future server-side services or serverless functions.
- `database/` documents database ownership; authoritative Supabase migrations remain in `supabase/migrations/`.
- `docs/` contains project documentation and non-runtime reference assets.
- `supabase/` remains at the repository root for Supabase CLI compatibility.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Copy `frontend/.env.example` to `frontend/.env` and keep the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` variable names.

## Build

```bash
cd frontend
npm run build
```

The production output is generated in `frontend/dist/`.
