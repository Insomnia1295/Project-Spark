# Phase 0 — Result

Foundation & skeleton for NETRUN OS ("Project Spark"). This documents what was built,
how to finish the cloud wiring, the seeded logins, how to run each self-test, the
security model, and deviations.

Status legend: ✅ done & verified.

> **Cloud wiring is LIVE and verified.** Project `irjfldzilfpkifmylxfp` linked; migrations
> pushed; `roll` function deployed; 6 accounts + Steven seeded. `node scripts/selftest-live.mjs`
> reports **10/10 passing** (auth, RLS isolation, seed correctness, skill map, Edge Function
> roll + logging). Local `npm test` reports **14/14**.

---

## 1. What was built

| Area | Status | Where |
|---|---|---|
| Tauri 2 + Vite + React + TS (strict, no `any`) | ✅ | root, `src-tauri/` |
| Two role-gated surfaces `/portal` + `/admin` + auth guard | ✅ | `src/app/App.tsx` |
| Theme port (tokens, Corpta + Inter fonts, f1c nav, no-overlap, 1600×1000 fit-scaler) | ✅ | `src/theme/`, `src/app/` |
| Login screen (email/password) | ✅ | `src/features/auth/LoginScreen.tsx` |
| Typed Supabase client (anon key + RLS only) | ✅ | `src/lib/supabase.ts` |
| Migrations + RLS (`profiles`, `character_sheet`, `skill_def`, `content_version`, `dice_roll`) | ✅ live | `supabase/migrations/` |
| Zod schemas + `SCHEMA-PATTERN.md` | ✅ | `src/schemas/`, `Docs/SCHEMA-PATTERN.md` |
| Dice/RNG module (seedable xoshiro256**) + 14 unit tests | ✅ | `src/lib/dice/` |
| Server-authoritative `roll` Edge Function (CSPRNG, logs to `dice_roll`) | ✅ deployed | `supabase/functions/roll/` |
| Realtime smoke test (Presence + Broadcast) | ✅ | `src/features/dev/RealtimeSmoke.tsx` |
| Account + Steven seed script + live self-test harness | ✅ ran | `scripts/seed-accounts.mjs`, `scripts/selftest-live.mjs` |
| Auto-update: Tauri updater config + signing keypair + GitHub Actions | ✅ | `src-tauri/tauri.conf.json`, `.github/workflows/release.yml` |

🟡 items are fully coded and compile/typecheck; they need your hosted Supabase project
to run against (see §3).

---

## 2. Verified locally (no cloud needed)

- ✅ **`npm test`** — 14/14 dice tests pass. Covers: d10 distribution ≈10% over 100k;
  nat-10 adds exactly one extra die and does **not** chain; nat-1 subtracts one;
  seeded PRNG reproducible; `skillCheck` totals (Education 6 + INT 8 = +14 before die).
- ✅ **`npm run typecheck`** — 0 errors under strict TS (no `any`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, etc.).
- ✅ **`npm run build`** — Vite production build succeeds (147 modules).
- ✅ **`cargo check`** (in `src-tauri/`) — Tauri 2.11.5 + updater plugin compile clean.
- ✅ **0 npm vulnerabilities** (upgraded Vite 7 / Vitest 3 to clear dev-only advisories).

---

## 3. Finish the cloud wiring (needs your Supabase project)

Exact click-paths — assumes no Supabase familiarity.

1. **Create the project** (if not done): [supabase.com/dashboard](https://supabase.com/dashboard)
   → **New project** → name `netrun-os`, set a strong **DB password** (save it), pick a
   near region, **Free** plan. Wait ~2 min.
2. **Get URL + anon key:** project → **Settings (gear)** → **API** → copy **Project URL**
   and the **`anon` `public`** key → paste into `.env` (copy from `.env.example`).
3. **Get the ref:** **Settings → General** → **Reference ID**.
4. **Link + push schema:**
   ```powershell
   supabase link --project-ref <ref>      # will prompt for the DB password
   supabase db push                       # applies both migrations
   ```
5. **Deploy the dice function:**
   ```powershell
   supabase functions deploy roll
   ```
   (The function auto-receives `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` as secrets — you do **not** set these manually.)
6. **Seed accounts + Steven:** get the **service_role** secret from **Settings → API**
   (the `service_role` key — treat it like a password, do NOT put it in `.env`), then:
   ```powershell
   $env:SUPABASE_URL="https://<ref>.supabase.co"
   $env:SUPABASE_SERVICE_ROLE_KEY="<service_role secret>"
   node scripts/seed-accounts.mjs
   ```

---

## 4. Seeded logins (6 accounts)

Created by `scripts/seed-accounts.mjs`. Default password `netrun-2076` (override with
`$env:SEED_PASSWORD` before seeding; change these before real play).

| Role | Email | Display name |
|---|---|---|
| GM | `gm@netrun.local` | Game Master |
| Player | `steven@netrun.local` | Steven "Doc" Heartman *(featured PC, owns the seeded sheet)* |
| Player | `player2@netrun.local` | Player Two |
| Player | `player3@netrun.local` | Player Three |
| Player | `player4@netrun.local` | Player Four |
| Player | `player5@netrun.local` | Player Five |

Steven's seeded stats: INT 8 · REF 6 · DEX 4 · TECH 8 · COOL 7 · WILL 5 · LUCK 7 ·
MOVE 3 · BODY 8 · EMP 7 · HP 45/45 · Humanity 42 · Reputation tracked-but-hidden (0, GM sets later).

---

## 5. Self-tests — how to run each

| # | Test | Command / action | Expected |
|---|---|---|---|
| 1 | App launches themed + login | `npm run tauri dev` | Window shows NETRUN OS shell + login |
| 2 | Auth/role routing | Log in as GM → `/admin`; player → `/portal` | Correct surface per role |
| 3 | Migration + RLS | After `db push`, log in as player2 → DebugPanel shows *only their* sheet (none seeded → "no sheet"); GM sees Steven's | Player cannot read others' sheets; GM can |
| 4 | Dice units | `npm test` | 14/14 pass (distribution, no-chain crit, reproducible, totals) |
| 5 | Edge Function | In-app **"Server Roll (Edge Fn)"** button | Returns `{die, extraDie, total, critical, fumble, rollId}`; a `dice_roll` row is inserted |
| 6 | Realtime | Open two instances, use the **Realtime Smoke** panel | Each sees the other in Presence; Broadcast pings arrive |
| 7 | Theme / no-overlap | Resize the window | Corpta/Inter render; nav flat/angular hover-expand; nothing overlaps at 1600×1000 and on resize |

---

## 6. Auto-update — remaining manual steps (deferred, non-blocking)

- Signing **keypair generated** at `~/.tauri/netrun-os.key` (+ `.pub`). The **public key
  is already in** `src-tauri/tauri.conf.json`.
- Before publishing releases, in the GitHub repo → **Settings → Secrets and variables →
  Actions** add:
  - `TAURI_SIGNING_PRIVATE_KEY` = contents of `~/.tauri/netrun-os.key`
  - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` = `netrun-signing-2076` (the password used to generate it)
- Edit `src-tauri/tauri.conf.json` → `plugins.updater.endpoints` → replace `OWNER/REPO`
  with the real GitHub repo.
- Push a tag `v0.1.0` to trigger `.github/workflows/release.yml`. Publishing a real
  release to test the full update round-trip is deferred to a later phase.

⚠️ The private key file and its password are **secret** — never commit them.

---

## 7. Security notes

- Client uses **anon key + RLS only**. `src/lib/supabase.ts` never references the service_role key.
- `service_role` is used **only** by the local seed script (runtime env var) and inside the
  `roll` Edge Function (Supabase-managed secret). It is not in `.env` or any client bundle.
- `.env` is gitignored; `.env.example` documents the shape. Signing keys are gitignored.
- All consequential rolls resolve server-side; `is_gm()` is `SECURITY DEFINER` to enforce
  GM-only policies without RLS recursion.

---

## 8. Deviations & notes

- **Vite 5 → 7 / Vitest 2 → 3.** Bumped to clear 5 dev-only advisories (1 critical in the
  Vitest UI, which we don't use). 0 vulnerabilities now. Runtime app unaffected (ships static `dist/`).
- **Fonts sourced from `Assets/Fonts/`** (the real Corpta DEMO + Inter files) rather than
  extracting the base64 from `app.html` — same fonts, cleaner. Copied into `public/fonts/`.
  Corpta DEMO is an uppercase-only demo set, which matches the "Corpta = all-caps" rule.
- **HashRouter** (not BrowserRouter) for robust routing inside the packaged Tauri app.
- **Fixed stage is 16:9 (1600×900)**, not the mock's 16:10 (1600×1000), so it fills
  standard monitors edge-to-edge without letterboxing. The fit-scaler still preserves
  aspect ratio; residual space on non-16:9 screens is themed (not black). Later screen
  ports target the 900px height.
- **Auth-callback deadlock fix:** profile loads are deferred out of the
  `onAuthStateChange` callback (supabase-js holds an auth lock during it). Added a boot
  splash + a Retry/Sign-Out error screen so profile loading can never silently hang.
- **Docs live in `Docs/`** (capital D) as in the repo, not lowercase `docs/`.
- **Reference-data seed** (`skill_def`) uses a representative Cyberpunk RED RAW skill→stat
  map; it's GM-editable data, expandable in later phases.
- **Nav is chrome-only** this phase (no tab content) per scope; the dev DebugPanel +
  RealtimeSmoke stand in for real screens and get replaced in Phase 1.

---

## 9. Next: Phase 1 — Portal read path

All 7 tabs render from cloud (Steven's real data); skill+stat auto-totals + click-to-roll;
Profile→Background slide page; realtime GM-edit reflection.
