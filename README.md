# NETRUN OS — "Project Spark"

Companion desktop app for a 5-player Cyberpunk RED campaign. One codebase, two
role-gated surfaces (**Player Portal** + **GM Admin**), synced through one Supabase
project. Tauri 2 + React + TypeScript + Vite.

See `Docs/cyberpunk-red-portal-plan-v0_6.md` for the full plan and
`Docs/PHASE-0-RESULT.md` for what Phase 0 delivered.

## Prerequisites (already installed on the dev machine)

Node 24 · Rust 1.96 (MSVC) · Supabase CLI · Git.

## First-time setup

```powershell
# 1. Install JS deps
npm install

# 2. Configure Supabase (see Docs/PHASE-0-RESULT.md for exact dashboard paths)
Copy-Item .env.example .env
#   then edit .env -> VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

# 3. Link the CLI to your hosted project + push the schema
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push

# 4. Deploy the server-authoritative dice function
supabase functions deploy roll

# 5. Seed the 6 accounts + Steven's sheet (service_role key, runtime env only)
$env:SUPABASE_URL="https://<ref>.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="<service_role secret>"
node scripts/seed-accounts.mjs
```

## Run

```powershell
npm run tauri dev     # launch the desktop app
npm test              # dice unit tests
npm run typecheck     # strict TS, no emit
npm run build         # production web build (tsc + vite)
```

## Security model (every phase)

- Client build uses the **anon key + Row-Level Security only**.
- The **service_role key is never bundled** — it lives as an Edge Function secret and
  is used only by the local one-time seed script (via a runtime env var).
- All consequential dice/rolls resolve **server-side** in the `roll` Edge Function.
- Secrets live in a gitignored `.env`; `.env.example` documents the shape.
