# Phase 0 — Foundations & Skeleton
### Claude Code build prompt · NETRUN OS ("Project Spark") · Cyberpunk RED Player Portal

> **How to use this file.** Drop this file, `app.html` (the visual-reference mock), and `cyberpunk-red-portal-plan-v0_6.md` (the full plan) into the project's `docs/` folder. Open Claude Code in the project root and tell it: *"Read `docs/PHASE-0-foundations-prompt.md` and the two reference files it points to, then build Phase 0. Ask me for anything you need."*

---

## 0. Read first — context & non-negotiables

You are building the foundation for a cloud-synced **desktop app** for a 5-player Cyberpunk RED tabletop campaign. One codebase, two surfaces: a **Player Portal** (read-mostly + limited self-edits) and a **GM Admin** surface (full edit + authoring). They sync through one hosted **Supabase** project. This phase builds the **skeleton only** — no feature screens yet.

**Before writing code, read these in the repo:**
- `docs/cyberpunk-red-portal-plan-v0_6.md` — the full plan. Pay attention to **§2 (stack), §3 (principles), §4 (cross-cutting systems), §5 (combat), §13 (locked decisions)**.
- `docs/app.html` — the self-contained visual mock (all 7 screens). **Visual reference only** — design is not frozen, but the tokens/fonts/nav concept carry over.

**Non-negotiable principles (apply to every phase):**
- **Data-driven, not hard-coded.** All content (character data, skill→stat map, dice config, later: quests/NPCs/assets) lives as **JSON validated by Zod**, in Supabase. UI reads data; nothing content-like is hard-coded.
- **TypeScript strict.** No `any`. Typed Supabase client.
- **Security:** client apps use the **anon key + Row-Level Security only**. The **service_role key is NEVER bundled in any client build** — it lives only as an Edge Function secret in Supabase. All privileged/consequential operations (e.g. dice rolls) go through **Edge Functions**.
- **Secrets never committed.** Use a gitignored `.env`; provide `.env.example`.
- **2D only.** There is no 3D anywhere in this project.
- **Keep it light.** Only add the dependencies listed below. Pixi/dnd-kit/GSAP come in later phases — do **not** add them now.

---

## 1. Goal of this phase

A runnable **Tauri 2 + React + TypeScript + Vite** desktop app with two role-gated surfaces (`/portal`, `/admin`), wired to the hosted Supabase project, delivering: **auth (6 accounts)**, a **foundational migration + Zod schema pattern**, the **dice/RNG module + a server-authoritative Edge Function**, a **realtime smoke test**, the **ported design theme** (tokens + fonts + nav shell) from the mock, and **auto-update scaffolding**. Everything else builds on this.

---

## 2. Tech & versions (already installed on this machine)

Node 24, Rust 1.96 stable (MSVC toolchain), Tauri 2.x, Supabase CLI (via Scoop), Git — all present. **Package manager: npm.**

Add only these libraries this phase: `react`, `react-dom`, `typescript`, `vite`, `@tauri-apps/cli`, `@tauri-apps/api`, `@supabase/supabase-js`, `zustand`, `@tanstack/react-query`, `zod`, `framer-motion`. (No Pixi, dnd-kit, or GSAP yet.)

---

## 3. Scope — what to build

### 3.1 Project scaffold
- Scaffold Tauri 2 with a Vite + React + TypeScript frontend. Strict `tsconfig`.
- Propose and create a clean folder structure (e.g. `src/app`, `src/features`, `src/lib`, `src/theme`, `src/schemas`, `supabase/migrations`, `supabase/functions`, `docs/`).
- **Two surfaces in one codebase**, role-gated at runtime: `/portal` (players) and `/admin` (GM). A simple router + an auth/role guard is enough — no tab content yet, just the shell + a placeholder home per surface.

### 3.2 Supabase wiring + auth
- Create a gitignored `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; add `.env.example`. Build a single typed Supabase client.
- **Auth:** email/password. Seed **6 accounts** (1 GM + 5 players) and store a **role** (`gm` | `player`) per user (a `profiles` row keyed to `auth.users`). Build a minimal login screen; after login, route to `/admin` for the GM and `/portal` for players.
- **Ask the user** (see §8) for the Project URL, the anon public key, and the project ref + DB password so you can `supabase link` the local CLI to the hosted project. Give exact dashboard click-paths — assume the user does not know Supabase.

### 3.3 Foundational schema + Zod pattern
Establish the pattern the whole app follows — **not the full data model**, just the core spine:
- Set up the `supabase/migrations` workflow linked to the hosted project (`supabase link`, `supabase db push`).
- Create core tables with **RLS enabled** and example policies: `profiles` (id, role, display_name); `character_sheet` (owner, the 10 RED stats, hp/max_hp, humanity, move, etc.); `skill_def` (skill name → governing stat map); `content_version`. Policy examples: a player can **read/update only their own** sheet's allowed fields; the GM can read/write all. (Full per-field permission matrix comes in Phase 2 — here, just prove RLS works.)
- Write matching **Zod schemas** for each table and a short `docs/SCHEMA-PATTERN.md` so later phases follow the same shape.
- **Seed Steven Heartman's real data** (from the plan): stats INT 8 · REF 6 · DEX 4 · TECH 8 · COOL 7 · WILL 5 · LUCK 7 · MOVE 3 · BODY 8 · EMP 7; HP 45/45; Humanity 42. Seed the **skill→stat governing map** (Education→INT, Paramedic/First Aid/Cybertech→TECH, Conversation→EMP, Persuasion→COOL, etc. — full categories in plan §4.2).

### 3.4 Dice / RNG module + Edge Function
- **Pure TS dice module** (`src/lib/dice`): a seedable **xoshiro256\*\*** (or PCG) PRNG for previews/tests (reproducible), plus: `rollD10()`, `skillCheck({stat, skill, dv, mods})`, `rollNd6(n)`, `roll2d6()`.
- **CP RED resolution (LOCKED):** `1d10 + STAT + SKILL + mods` vs DV. Natural **10 → roll one more d10 and add** (once — **no chaining**). Natural **1 → roll one more d10 and subtract** (once). No house-rule toggle.
- **Server-authoritative Edge Function** `supabase/functions/roll`: uses a **CSPRNG** (`crypto.getRandomValues`), applies the same CP RED rules, returns `{ die, extraDie, total, critical, fumble, rollId }`, and logs to a `dice_roll` table. This is the authority for consequential rolls; the seedable module is for **UI previews and tests only**. The function holds the `service_role` key as a **Supabase secret**, never shipped to clients.

### 3.5 Realtime smoke test
- A tiny **dev-only** screen proving the live layer: use Supabase Realtime **Presence** (who's online) + **Broadcast** (echo a message). With two app instances running, each should see the other's presence and receive a broadcast. This de-risks the live Session arena before we build it.

### 3.6 Theme port from the mock
- Extract **design tokens** from `docs/app.html`: `--p1 #ff5aa8`, `--p1d #7a1f52`, `--p2 #9a6cff`, `--news #b76bff`, `--ok #3ff0a0`, the glass fills (`rgba(10,14,24,.5–.62)` + blur), and hairline borders. Put them in a `src/theme` layer (CSS variables).
- **Extract the embedded base64 fonts** (Corpta DEMO + Inter) from `app.html` into real font files and wire `@font-face`. **Corpta = all-caps** display/nav/numeric headings (feed it uppercase only); **Inter Light 300** = body; slightly increase Corpta letter-spacing, especially at small sizes.
- Build the **app shell chrome only** (not tab content): the **f1c nav** concept — a column of separate flat **angular** buttons (bottom-left corner clip), collapsed-to-icons that **expand on hover**, active = pink→deep-pink gradient. Enforce the **no-overlap layout rule** (no two elements touch; content clears the nav via a fixed left gutter) and the **1600×1000 fit-scaler** (scale the fixed stage to the window).

### 3.7 Auto-update scaffolding
- Configure the **Tauri updater**; generate the update signing keypair. Add a **GitHub Actions release workflow** (`tauri-action`) that builds the Windows installer on tag. Provide instructions for the user to add the keypair/secrets to the GitHub repo. **Publishing a real release to test the update flow can be deferred** — this phase just needs the config + workflow in place and building.

---

## 4. Self-tests you (Claude Code) must run and report

Run each, report pass/fail + output, and give the exact command to reproduce:
1. `npm run tauri dev` launches a window showing the themed shell + login.
2. **Auth/role:** log in as the GM → lands on `/admin`; log in as a player → lands on `/portal`.
3. **Migration + RLS:** migration applies to the hosted project; a player **cannot** read another player's `character_sheet`; the GM **can** read all.
4. **Dice unit tests:** (a) 100k-roll distribution sanity — each d10 face ≈ 10%; (b) natural 10 adds exactly one extra die and does **not** chain; natural 1 subtracts exactly one; (c) seeded PRNG is reproducible; (d) `skillCheck` totals are correct (e.g. Education skill 6 + INT 8 = +14 before the die).
5. **Edge Function:** `roll` returns the documented structure and inserts a `dice_roll` row; the client can invoke it.
6. **Realtime:** two instances see each other via Presence and receive a Broadcast message.
7. **Theme:** shell renders with Corpta/Inter and the correct tokens; nav buttons are flat/angular with hover-expand; **nothing overlaps** at 1600×1000 and on window resize.

---

## 5. What the user (GM) tests after this phase
- Launch the app; log in as the GM and as a player (you'll provide the 6 seeded logins).
- Confirm the shell looks like the mock — fonts, colors, angular nav, **nothing overlapping** — and resizes cleanly.
- Open two instances and use the presence/broadcast dev screen to watch live sync work.
- Confirm Steven's seeded stats appear somewhere minimal (a debug panel is fine this phase).

---

## 6. Deliverables to leave in the repo
- Running Tauri app (portal + admin shells, login, themed).
- `supabase/migrations` + seed; `supabase/functions/roll`; RLS policies.
- `src/lib/dice` module + tests; `src/theme` + extracted font files; realtime smoke screen.
- `.env.example`; auto-update config + GitHub Actions workflow.
- `docs/PHASE-0-RESULT.md` summarizing: what was built, the **6 seeded logins**, how to run each self-test, security notes (anon vs service_role), and any follow-ups/deviations. Keep `docs/` updated so the next phase has context.

---

## 7. What to ask the user for (with exact locations)
Assume the user does **not** want to wrestle with Supabase — give copy-paste-precise steps:
- **Project URL + anon public key:** Supabase Dashboard → your project → **Settings → API** (URL, and the `anon` `public` key). These go in `.env`.
- **Project ref + database password:** Settings → General (ref) and the DB password you set — needed for `supabase link`.
- **Do NOT ask for or place the `service_role` key in any client `.env`.** If the Edge Function needs it, set it as a Supabase **function secret**, not in the app.
- Confirm the **GitHub repo** to attach the release workflow to.

Ask for these one at a time, tell the user exactly where to click, and stop if anything's unclear rather than guessing.
