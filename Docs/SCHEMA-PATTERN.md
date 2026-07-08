# NETRUN OS — Schema / Data Pattern

Every content entity in NETRUN OS follows the same shape. This is the backbone of
the "data-driven, not hard-coded" principle (plan §3.1). Later phases add tables, but
they all follow this pattern.

## The five layers of every entity

1. **Postgres table** (`supabase/migrations/*.sql`)
   - `id uuid primary key default gen_random_uuid()` (except `profiles.id` = `auth.users.id`).
   - `created_at timestamptz not null default now()`, and `updated_at` (+ touch trigger) for mutable rows.
   - `check` constraints for domain rules (e.g. RED stats `between 1 and 10`).
   - **RLS enabled**, with explicit policies (never rely on "no policy = locked" by accident).

2. **RLS policy** — who can read/write.
   - Ownership check: `owner = auth.uid()`.
   - Role check: `public.is_gm()` — a `SECURITY DEFINER` helper that reads `profiles`
     without triggering RLS recursion.
   - Players get narrow, column-limited writes (fully enforced from Phase 2);
     GM gets full access.

3. **Row type** (`src/lib/database.types.ts`) — the TypeScript shape of a table row,
   fed to the typed `supabase` client generic. (Can later be replaced by
   `supabase gen types typescript`.)

4. **Zod schema** (`src/schemas/`) — validates any row the client reads **at the boundary**
   before the app trusts it. If a row fails validation, the UI shows an error rather than
   rendering bad data. Names mirror the table (`character_sheet` → `characterSheetSchema`).

5. **Consumption** — components read via TanStack Query + the typed client, `safeParse`
   the result with the Zod schema, and render. Nothing content-like is a hard-coded literal.

## Rules

- **No `any`.** TypeScript strict. Types flow from `Database` → query results → Zod-validated
  domain types.
- **Anon key + RLS only in the client.** The `service_role` key never ships in a client build.
  Privileged writes (dice, later: authoritative combat state) go through **Edge Functions**.
- **Reference data lives in tables**, seeded by migration (e.g. `skill_def`), and is GM-editable —
  not baked into the UI.
- **Versioning.** `content_version` rows let the client know when a category of content changed.

## Worked example — `character_sheet`

| Layer | Where |
|---|---|
| Table + checks + RLS | `supabase/migrations/0001_init.sql` |
| Row type | `CharacterSheetRow` in `src/lib/database.types.ts` |
| Zod schema | `characterSheetSchema` in `src/schemas/index.ts` |
| Read + validate | `src/features/dev/DebugPanel.tsx` (`safeParse`) |

To add a new entity in a later phase, repeat all five layers in the same order.
