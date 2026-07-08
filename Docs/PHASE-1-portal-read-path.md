# Phase 1 — Player Portal, Read Path
### Claude Code build prompt · NETRUN OS ("Project Spark") · Cyberpunk RED Player Portal

> **How to run this phase.** Start a **fresh Claude Code session** (Phase 0 is committed). Put `Steven_Heartman.pdf` (the authoritative character sheet) into `Docs/reference/` if it isn't already, alongside `app.html` and the v0.6 plan. Then tell Claude Code:
> *"Read `Docs/PHASE-1-portal-read-path.md` and the files it points to (the v0.6 plan, `Docs/PHASE-0-RESULT.md`, `Docs/SCHEMA-PATTERN.md`, `Docs/app.html`, `Docs/reference/Steven_Heartman.pdf`), then build Phase 1. Ask me for anything you need."*
> **First action this session:** if a root `CLAUDE.md` doesn't exist yet, run `/init` to generate one, then trim it to a lean (<200-line) project brief (stack, structure, conventions, key commands, "current phase", pointers to `Docs/`). Keep it updated at the end of this phase.

---

## 0. Read first — context & non-negotiables

Phase 0 delivered the skeleton: Tauri 2 + React + TS + Vite, two role-gated surfaces (`/portal`, `/admin`), Supabase wired (anon key + RLS), auth with 6 seeded accounts, Steven's core sheet seeded, the dice module + server-authoritative `roll` Edge Function, a realtime smoke test, and the ported theme (tokens, Corpta + Inter, f1c nav shell, 16:9 **1600×900** fixed stage + fit-scaler). Read `Docs/PHASE-0-RESULT.md` for the exact state, logins, and commands.

**This phase = the read-only Player Portal.** All 7 tabs render **from the cloud** (Steven's real data), with skill/stat auto-totals + click-to-roll, the Profile→Background slide page, and live GM-edit reflection. **No editing yet** — player self-edits are Phase 2. Get the *display* correct and fully data-driven.

**Non-negotiables (every phase):** data-driven not hard-coded (content in Supabase, validated by Zod per `Docs/SCHEMA-PATTERN.md`); TypeScript strict, no `any`; client uses anon key + RLS only (service_role never in a client build); 2D only; add only the dependencies a task needs. Follow the existing theme — design may still change later, so keep it swappable (see §5).

---

## 1. Goal

Open the Player Portal as **steven@netrun.local** and see all 7 tabs populated from Supabase with Steven's real data, matching the mock's **layout/concept** (not necessarily pixel styling): Home, Profile (+ Background slide), Inventory, Store, Activities, Contacts, Story So Far. Skills and stats show computed totals and roll on click (via the Phase 0 `roll` function). When the GM changes a value in the DB, the portal updates live without reload.

---

## 2. Scope — the 7 tabs (read-only, from cloud)

Build each as the mock realizes it (see `Docs/app.html` for layout/concept; plan §4 for the spec). Reconcile all character data to the **authoritative sheet** `Docs/reference/Steven_Heartman.pdf`; use `app.html` only as a secondary/visual reference where the sheet is silent.

**2.1 Home** — centered hero (temporary placeholder art, see §6); nameplate top-right (two lines **STEVEN / HEARTMAN**, class line **MEDTECH · RIPPER-DOC MERC**); vitals **HP 45/45**, **Humanity 42** (number only, no max; keep the humanity bar), **no Reputation shown**; bottom-left **CURRENT MISSION** = "Search for Hailey Phantom in Day City"; bottom-right **City News** (expandable) = the Arasaka bounty bulletin. All values from DB.

**2.2 Profile** — portrait + nameplate card; a spaced 2×2 grid: **Stats** (the 10 RED stats, display-only/GM-locked), **Vitals** (HP / Humanity / Death Save), **Top Skills** (curated subset, each showing **level + governing-stat total**, e.g. Paramedic 6 + TECH 8 → **+14**), **Chrome** (cyberware). Plus the **Background slide-out page**: a control at the **bottom-right** slides the whole screen **right** to reveal a second Profile page holding the **Lifepath/background** element (personality, motivation, cultural region, clothing, hairstyle, affectation, languages, family background, childhood, family crisis, role-specific lifepath — all from Steven's sheet). A back control slides it left. Read-only this phase.

**2.3 Inventory** — category sub-tabs (All / Weapons / Armor / Utility / Implants / Junk), a 4-up grid of item cards, and a detail panel. Fix the quantity display to render clearly (e.g. **×1** with spacing, or "Qty 1"). Seed and render **Steven's real gear** from the sheet (weapons, armor SP, ammo counts, cyberware/borgware, medical gear, cash).

**2.4 Store** — status bar (Open + closes-in countdown), category sub-tabs (visual only), a 4-up product grid, a Cart panel with total. **View-only this phase** (buying is Phase 10). Seed the catalog + the locked prices from plan §7.4 (500 · 350 · 5,000 · 3,500 · 500 · 500 · 500 · 25,000 in grid order).

**2.5 Activities** — a large **Free Time remaining** card (hours) + segmented meter; a **Standard Activities** list (each with an hour cost; unaffordable ones greyed); a **Random Activities** board (cards named after Steven's contacts/NPCs — Poker Night / Kane Shand, House Call / Alicia Makamov, Afterlife Drinks / Fazalus Ingenjade — with reward, deadline, skill-check DV, attempt progress). Display-only; running them is a later phase.

**2.6 Contacts** — encrypted-channel list (contacts from the sheet: Alicia Makamov, Fazalus Ingenjade, Kane Shand — Friends; Emily — Love), a chat thread area (empty), and a compose bar labelled "routes to your GM". **Display-only** this phase (messaging is Phase 11) — the compose bar can render but need not send yet.

**2.7 Story So Far** — lands on a horizontal **ribbon** timeline (Sessions 01–04). Clicking an entry animates up into a **vertical detail view** (full timeline left, selected entry highlighted + a featured panel right with the expanded write-up). A "Back to timeline" control returns to the ribbon. Content from DB (the four sessions from plan §6). Ribbon and vertical views must be DOM siblings toggled cleanly (per the plan's build note).

---

## 3. Skill/stat auto-totals + click-to-roll

- **Display:** every skill shows `level + governing stat` as a total (e.g. **+14**), computed from the `skill_def` governing-stat map seeded in Phase 0 + Steven's stats. It must **recompute automatically** if a level or stat changes (which it will, live, via §4).
- **Click-to-roll:** clicking a **skill** rolls `d10 + level + governing stat`; clicking a **stat** rolls `d10 + stat`. Route the roll through the Phase 0 **server-authoritative `roll` Edge Function** (CP RED crit/fumble rules), and show the result (die, any crit/fumble die, total). The seedable client PRNG is for previews/tests only.

---

## 4. Live GM-edit reflection (realtime)

Subscribe (Supabase Realtime Postgres changes) to the tables each tab reads. When the GM edits a value in the DB (or you edit a row directly in the Supabase dashboard for the test), the portal **repaints live without reload** — HP, humanity, news, mission, inventory, free-time, etc. Reuse the realtime plumbing proven in Phase 0.

---

## 5. Interchangeability — acceptance criteria (enforced this phase)

Design is still subject to change, so the frontend must stay easy to re-skin and re-content:
- **No hardcoded colors, fonts, radii, or spacing in components** — everything references the `src/theme` tokens/scale. A palette change = editing tokens, not screens.
- **No hardcoded content** — every label, number, list, and copy string comes from Supabase data (Zod-validated), not literals in JSX. (UI-chrome words like a button caption are fine; character/campaign content is not.)
- **Screens composed from reusable primitives** — shared `Panel`, `Card`, `SectionHeader`, `StatChip`, `Bar`, `NavButton`, etc., so a restyle propagates everywhere. No copy-pasted one-off markup per screen.
- **Art referenced indirectly** — hero/portrait/wallpaper/icons resolved through a small **asset registry** (id → source) so Phase 4's asset library can swap the source without touching screens.
- **Formulas/config are data** — skill→stat map, grid presets, dice config already live in data; keep it that way.

State in `PHASE-1-RESULT.md` how each criterion was met.

---

## 6. Temporary placeholder art (until Phase 4)

Real backgrounds/sprites arrive with the asset library in Phase 4. For now, use clearly-marked **temporary bundled placeholders** for the hero, portrait, and wallpaper (you may extract them from `Docs/app.html`, or use tasteful themed placeholders), resolved through the asset registry (§5) so they swap out cleanly later. Don't block on final art.

---

## 7. Data model to add this phase (follow `SCHEMA-PATTERN.md`)

Add tables + RLS (read for the owning player + GM; **writes stay GM-only for now** — player writes are Phase 2), Zod schemas, and **seed Steven's real data** for each: `inventory_item`, `catalog_item` + `store_settings`, `contact`, `news_post`, `mission`, `timeline_event` (story), `activity` (standard + random), `free_time_ledger`, and the full `skill` set for Steven (levels), plus `cyberware`. Reconcile every value to `Steven_Heartman.pdf`. Keep each entity's five layers (table → RLS → row type → Zod → consumption) consistent.

---

## 8. Self-tests you (Claude Code) must run and report
1. `npm run tauri dev`, log in as **steven@netrun.local** → all 7 tabs render populated from the DB (no hardcoded content).
2. **Skill totals:** unit tests confirm the computation (Education 6+INT8=+14, Conversation 6+EMP7=+13, Persuasion 5+COOL7=+12, Concentration 2+WILL5=+7).
3. **Click-to-roll:** clicking a skill and a stat calls the `roll` Edge Function and shows a valid result; a `dice_roll` row is logged.
4. **Background slide:** the Profile bottom-right control slides to the Background page and back; 60fps, GPU-composited (transform/opacity only).
5. **Realtime:** change one of Steven's values in the Supabase dashboard → the portal repaints live without reload.
6. **Story:** ribbon → click → vertical detail → back to ribbon works; views toggle cleanly (no nesting bug).
7. **No-overlap + fit:** nothing overlaps at 1600×900 and on resize; content clears the nav gutter.
8. **Typecheck/build:** `npm run typecheck` 0 errors; `npm run build` clean.
9. **Interchangeability:** grep confirms no hardcoded hex colors / spacing literals in screen components; content originates from data. Report findings.

---

## 9. What the user (GM) tests after this phase
- Log in as **steven@netrun.local**; walk all 7 tabs and confirm they match the mock's layout and the sheet's data.
- Click a couple of skills and a stat to see server rolls.
- Open the Profile → Background slide and back.
- In the Supabase dashboard, change Steven's HP (or news text) and watch the portal update live.
- Confirm nothing overlaps and the screen fills a 16:9 window.

---

## 10. Deliverables to leave in the repo
- All 7 read-only portal tabs, data-driven, themed, with skill totals + click-to-roll, the Background slide, and live realtime.
- New migrations + seeds (§7); Zod schemas; reusable UI primitives; the asset registry with temporary placeholders.
- `Docs/PHASE-1-RESULT.md` (what was built, how to run each self-test, interchangeability report, deviations) and an updated lean **`CLAUDE.md`** (current phase, new conventions/primitives, key commands). Then make the Phase 1 git commit and push.

---

## 11. Notes
- **If context gets tight** (~60–70%, watch `/context`): finish the current screen, have CC update `PHASE-1-RESULT.md`, then `/compact` (or `/clear` + fresh session pointing at the result doc) and continue. A natural split is Home/Profile/Inventory/Store, then Activities/Contacts/Story.
- Reputation stays **tracked-but-hidden** (seeded 0; not shown on Home).
- Screens target the **1600×900** stage established in Phase 0.
