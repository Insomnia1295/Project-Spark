# CLAUDE.md — NETRUN OS ("Project Spark")

A Tauri 2 + React + TS desktop companion app for a 5-player **Cyberpunk RED** campaign:
one codebase, two role-gated surfaces (**Player Portal** + **GM Admin**), synced through
one Supabase project.

> Read this first every session. Human-facing docs are in `README.md`; the full plan and
> phase specs live in `Docs/`. This file is the lean brief — keep it under ~200 lines.

---

## Current status

- **Phase 0: done & verified.** Skeleton — Tauri 2 + Vite + React + TS (strict), two
  role-gated surfaces (`/portal`, `/admin`) + auth guard, Supabase wired (anon + RLS),
  6 seeded accounts, Steven's core sheet seeded, dice module + server-authoritative `roll`
  Edge Function, realtime smoke test, ported theme. Cloud is live (`selftest-live.mjs`
  10/10; local `npm test` 14/14). See [Docs/PHASE-0-RESULT.md](Docs/PHASE-0-RESULT.md).
- **Phase 1: done & live.** Read-only Player Portal — all 7 tabs (Home, Profile+Background,
  Inventory, Store, Activities, Contacts, Story So Far) render **from the cloud** with
  skill/stat auto-totals + server click-to-roll and live GM-edit reflection. Migration 0003
  applied, `seed-phase1.mjs` run, GM-confirmed working end-to-end. See
  [Docs/PHASE-1-RESULT.md](Docs/PHASE-1-RESULT.md). Player self-edits are Phase 2.
- **Portal conventions (Phase 1):** screens compose primitives in `src/app/ui/`; all colors
  via `src/theme` tokens + `portal.css` (no hex in screens); data via `features/portal/data.ts`
  hooks (Zod-validated, realtime-invalidated); art via `app/assets.ts` registry; consequential
  rolls via `features/portal/roll.tsx`.
- **App chrome:** `StageViewport` (used by every screen) hosts a bottom-left full-screen
  toggle (`src/app/fullscreen.ts` — Tauri native window API when packaged, browser Fullscreen
  API fallback on web) as a stand-in until a Settings tab exists. The stage's atmosphere
  gradient lives ONLY on `.stage-viewport` (not `.scene`, which is transparent) — don't
  reintroduce a second background on `.scene`, it recreates the letterbox seam bug fixed in
  commit `bec9db3`.

---

## Repo structure

| Path | What lives there |
|---|---|
| `src/app/` | Shell: `App.tsx` (routing + auth guard), `NavShell.tsx`, `StageViewport.tsx` (fit-scaler) |
| `src/features/` | Screens by domain: `auth/`, `portal/`, `admin/`, `dev/` (temp panels, replaced in Phase 1) |
| `src/lib/` | `supabase.ts` (typed anon client), `database.types.ts`, `session.ts`, `dice/` (PRNG + tests) |
| `src/schemas/` | Zod schemas — one per table, validate rows at the boundary |
| `src/theme/` | `tokens.css`, `global.css`, `fonts.css` — all colors/spacing/fonts as tokens |
| `supabase/migrations/` | SQL: tables + checks + RLS (`0001_init`, `0002_seed_reference`) |
| `supabase/functions/roll/` | Server-authoritative dice Edge Function (CSPRNG, logs to `dice_roll`) |
| `src-tauri/` | Rust host, `tauri.conf.json`, updater config, icons |
| `scripts/` | `seed-accounts.mjs` (one-time seed), `selftest-live.mjs` (cloud self-test) |
| `Docs/` | Plan, schema pattern, phase specs; `Docs/reference/` holds the source PDFs/mock |
| `public/fonts/` | Corpta DEMO + Inter font files |

---

## Core rule — data-driven, not hard-coded

Every content entity follows the five layers in [Docs/SCHEMA-PATTERN.md](Docs/SCHEMA-PATTERN.md):
**table → RLS → row type → Zod → consume**. To add an entity, repeat all five in order.

- **No hardcoded content** in components — every label, number, list, and copy string comes
  from Supabase (Zod-validated), not JSX literals. (UI-chrome words like a button caption
  are fine; character/campaign content is not.)
- **No hardcoded colors/spacing/radii/fonts** in components — everything references
  `src/theme` tokens. A restyle = editing tokens, not screens.
- **Reference data lives in tables** (e.g. `skill_def`), seeded by migration, GM-editable.
- Screens compose from reusable primitives (`Panel`, `Card`, `StatChip`, `Bar`, …);
  art resolves through an asset registry (id → source), not inline paths.

---

## Security model

- Client uses the **anon key + RLS only**. `src/lib/supabase.ts` never references `service_role`.
- The **`service_role` key never ships in a client build** — it's used only by the local
  seed script (runtime env var) and as a Supabase-managed secret inside the `roll` Edge Function.
- **Consequential dice/rolls resolve server-side** in the `roll` Edge Function (CSPRNG,
  CP RED crit/fumble rules, logs every roll). The client PRNG is for previews/tests only.
- `.env` and signing keys are gitignored; `.env.example` documents the shape.
- `is_gm()` is `SECURITY DEFINER` to enforce GM-only policies without RLS recursion.

---

## Locked decisions (persist across phases)

- **2D only** — no 3D anywhere.
- **Type:** Corpta DEMO (all-caps) for display/nav; **Inter Light 300** for body.
- **No two elements overlap or touch** — verified at the fixed stage and on resize.
- **Fixed 1600×900 (16:9) stage** + fit-scaler (preserves aspect; residual space themed, not black).
- **RAW Cyberpunk RED crits** — nat-10 adds exactly one die, no chaining; nat-1 subtracts one.
- **TypeScript strict, no `any`** (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` on).
- Reputation is **tracked-but-hidden** (seeded 0; not shown on Home).
- Routing uses **HashRouter** (robust inside the packaged Tauri app).

---

## Key commands

| Command | Purpose |
|---|---|
| `npm run tauri dev` | Run the desktop app (themed shell + login) |
| `npm test` | Vitest unit tests (dice, skill totals) |
| `npm run typecheck` | `tsc --noEmit` — must be 0 errors |
| `npm run build` | `tsc --noEmit && vite build` — production bundle |
| `supabase link --project-ref <ref>` / `db push` / `functions deploy roll` | Wire + migrate + deploy cloud |
| `node scripts/seed-accounts.mjs` | One-time seed (needs `SUPABASE_SERVICE_ROLE_KEY` env var) |
| `node scripts/selftest-live.mjs` | Live cloud self-test (auth, RLS, roll, logging) |

Seeded logins (default pw `netrun-2076`): `gm@netrun.local` (GM) and player accounts
`steven@` (featured PC, owns the seeded sheet), `seph@`, `frank@`, `victor@`, `zeusmd@` — all `@netrun.local`.

---

## Pointers

- [Docs/reference/cyberpunk-red-portal-plan-v0_6.md](Docs/reference/cyberpunk-red-portal-plan-v0_6.md) — full plan (v0.6)
- [Docs/PHASE-0-RESULT.md](Docs/PHASE-0-RESULT.md) — exact Phase 0 state, logins, self-tests, deviations
- [Docs/PHASE-1-portal-read-path.md](Docs/PHASE-1-portal-read-path.md) — Phase 1 build spec
- [Docs/PHASE-1-RESULT.md](Docs/PHASE-1-RESULT.md) — Phase 1 result, cloud handoff, self-tests
- [Docs/SCHEMA-PATTERN.md](Docs/SCHEMA-PATTERN.md) — the five-layer entity pattern
- [Docs/reference/Steven Heartman.pdf](Docs/reference/Steven%20Heartman.pdf) — authoritative character sheet (reconcile all PC data to this)
- [Docs/reference/app.html](Docs/reference/app.html) — visual/layout mock (secondary reference)


## When compacting or summarizing
Always preserve: the current phase + its spec path, the list of files modified this
session, any failing or pending tests, and any unresolved decisions.