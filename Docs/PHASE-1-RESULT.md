# Phase 1 — Result

The **read-only Player Portal**: all 7 tabs render Steven "Doc" Heartman's real data from
the cloud, with skill/stat auto-totals + server click-to-roll, the Profile→Background slide,
and live GM-edit reflection. Built to the spec ([PHASE-1-portal-read-path.md](PHASE-1-portal-read-path.md))
and reconciled to `reference/Steven Heartman.pdf`.

> **Status: code complete, typechecked, unit-tested, and builds clean; boots to the login
> screen with no console errors.** The live cloud walk-through (log in as Steven, see all 7
> tabs) needs two GM steps first — see **§1 Cloud handoff** — because applying the schema and
> seeding require the DB password + `service_role` key, which are not in `.env` by design.

---

## 1. Cloud handoff (GM runs once)

The build cannot push schema or seed data without secrets. Run these from your machine:

```powershell
# 1. apply migration 0003 (new tables + RLS + realtime + skill_def fixes)
supabase db push

# 2. seed Steven's content + shared/global content (needs the service_role secret)
$env:SUPABASE_URL="https://irjfldzilfpkifmylxfp.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="<service_role secret>"   # Settings → API
node scripts/seed-phase1.mjs
```

`seed-phase1.mjs` is idempotent — safe to re-run. It patches Steven's sheet (handle/role/
eddies), seeds his skills (levels), cyberware, inventory, contacts, mission, free-time,
lifepath background, and random activities, plus the global news / timeline / catalog /
store / standard activities.

---

## 2. What was built

- **Data model** (`supabase/migrations/0003_phase1_portal.sql`): 12 new tables + RLS
  (owner-read / GM-write) + realtime publication; `character_sheet` gained handle/role/eddies.
  Fixed the Phase 0 `skill_def` bug (Brawling/Martial Arts/Melee Weapon are **DEX**, not REF)
  and added Drive Land Vehicle, Language, Local Expert.
- **Types + Zod** for every entity (`database.types.ts`, `schemas/index.ts`).
- **Skill totals** (`lib/skills.ts`) — level + governing stat, pure + auto-recomputing.
- **Reusable primitives** (`src/app/ui/`): Panel, Card, SectionHeader, StatChip, VitalBar,
  Segmented, SkillRow, CategoryTabs, Pill, Avatar, IconBox, NavRail + a line-icon set.
- **Token-driven visual language** (`theme/portal.css` + tokens) — screens carry no raw colors.
- **Asset registry** (`app/assets.ts`) — art resolved by id → source (temp placeholders now,
  Phase 4 swaps the source without touching screens).
- **Data hooks + realtime** (`features/portal/data.ts`) — TanStack Query, Zod-validated at the
  boundary, one subscription invalidating on any GM edit.
- **Click-to-roll** (`features/portal/roll.tsx`) — routes through the server `roll` Edge
  Function; result shows in a bottom-center toast.
- **All 7 tabs** (`features/portal/screens/`): Home, Profile (+Background slide), Inventory,
  Store, Activities, Contacts, Story So Far.

---

## 3. Self-tests

| # | Test | How | Result |
|---|---|---|---|
| 2 | Skill totals | `npm test` | ✅ 25/25 (11 skill-total incl. Education +14, Conversation +13, Persuasion +12, Concentration +7, Brawling DEX +6; + 14 dice) |
| 8 | Typecheck / build | `npm run typecheck` · `npm run build` | ✅ 0 errors · ✅ 162 modules built |
| 9 | Interchangeability | grep hex in screens; grep content in screens | ✅ 0 hex color literals in screens; ✅ 0 hardcoded character content (all from data) |
| — | Boot smoke | vite dev + preview | ✅ renders login screen, no console errors |
| 1 | 7 tabs populated from DB | log in as steven@netrun.local *(after §1)* | ⏳ GM — needs cloud apply + seed |
| 3 | Click-to-roll logs a `dice_roll` | click a skill/stat *(after §1)* | ⏳ GM |
| 4 | Background slide 60fps | Profile → BACKGROUND ▸ | ⏳ GM (transform/opacity only — GPU-composited) |
| 5 | Realtime | edit a value in Supabase dashboard | ⏳ GM (auto-invalidate wired for all portal tables) |
| 6 | Story ribbon ↔ vertical | click a session → BACK | ⏳ GM (DOM siblings toggled via `hidden`) |
| 7 | No-overlap at 1600×900 | resize the window | ⏳ GM (panels re-fitted from the mock's 1000h to 900h) |

---

## 4. Interchangeability report (§5 criteria)

- **No hardcoded colors** — screens reference tokens/classes only; `grep` finds **0 hex color
  literals** in `src/features/portal`. All palette values live in `theme/tokens.css` +
  `theme/portal.css`. (A few structural alpha shadows/tints remain as inline `rgba(0,0,0,…)`
  — not palette colors.)
- **No hardcoded content** — every label/number/list comes from Supabase (Zod-validated).
  `grep` for character/campaign names in screens finds only a code comment.
- **Reusable primitives** — screens compose the `src/app/ui/` set; no copy-pasted one-off markup.
- **Art indirect** — hero/portrait/wallpaper/comic resolve through `app/assets.ts` by id.
- **Formulas/config are data** — skill→stat map (`skill_def`), catalog prices, activities,
  and dice config all live in tables.

---

## 5. Deviations & notes

- **Stage height 900, not the mock's 1000.** Panel coordinates were re-fitted to the locked
  1600×900 stage; layout/concept ported, not pixel positions.
- **Top Skills = highest computed totals** (data-driven ranking), not a hardcoded curated list;
  a FULL LIST toggle shows every skill. (A GM-curated `featured` flag can come later.)
- **Ammo split** seeded per the sheet (Basic HP ×118, Improved Smart HP ×7, Smart HP ×10,
  Shotgun ×24, Slug ×30) — the mock had merged the smart rows.
- **Session 4 title** uses "Sandy Gone Psycho!" (the data blob), not the ribbon's "Sandy Psycho".
- **Store / Contacts / Activities are view-only** — Store cart is ephemeral + checkout disabled
  (Phase 13); Contacts compose is inert (Phase 11); activities don't run yet.
- **Realtime** is wired as query invalidation on Postgres changes for all portal tables (the
  migration adds them to `supabase_realtime`). This is verifiable only against the live project.

---

## 6. Next

Phase 2 — player self-edits + RLS (cash/HP/skills-add/inventory/contacts/background), narrowing
the currently GM-only writes.
