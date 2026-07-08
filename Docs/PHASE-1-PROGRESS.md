# Phase 1 — Progress (resumable checklist)

> Durable state for the Phase 1 build. A fresh session can resume from this file alone.
> Spec: [PHASE-1-portal-read-path.md](PHASE-1-portal-read-path.md). Reconcile all PC data to
> `reference/Steven Heartman.pdf`. Rules: data-driven (no hardcoded content/colors), TS strict
> no `any`, anon+RLS only, tokens-only styling, reusable primitives.

## Build order (commit after each group)
- **Wave A — data layer**
- **Wave B — Home / Profile / Inventory / Store**
- **Wave C — Activities / Contacts / Story + realtime + click-to-roll**
- **Wave D — seed script, gates (typecheck/test/build), PHASE-1-RESULT.md**

## Cloud handoff (GM runs; needs secrets I don't have)
- [ ] `supabase db push` (applies migration 0003)
- [ ] `node scripts/seed-phase1.mjs` (needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
- [ ] verify live as steven@netrun.local

## Tables (table → RLS → row type → Zod → seed → consumed)
DDL+RLS, Types, Zod all ✅ in commit "Phase 1: data layer" (migration 0003).
Seed = scripts/seed-phase1.mjs (Wave D). Consumed = per-screen (Waves B/C).

| Table | DDL+RLS | Types | Zod | Seeded | Consumed |
|---|---|---|---|---|---|
| character_sheet (+handle/role_line/role_rank/role_ability/eddies) | ✅ | ✅ | ✅ | ☐ | ☐ |
| skill (per-char levels) | ✅ | ✅ | ✅ | ☐ | ☐ |
| skill_def fixes (Brawling/MA/Melee→DEX; +Drive/Language/Local Expert) | ✅ | ✅ | ✅ | ☐ | ☐ |
| cyberware | ✅ | ✅ | ✅ | ☐ | ☐ |
| inventory_item | ✅ | ✅ | ✅ | ☐ | ☐ |
| catalog_item | ✅ | ✅ | ✅ | ☐ | ☐ |
| store_settings | ✅ | ✅ | ✅ | ☐ | ☐ |
| contact | ✅ | ✅ | ✅ | ☐ | ☐ |
| news_post | ✅ | ✅ | ✅ | ☐ | ☐ |
| mission | ✅ | ✅ | ✅ | ☐ | ☐ |
| timeline_event | ✅ | ✅ | ✅ | ☐ | ☐ |
| activity (standard + random) | ✅ | ✅ | ✅ | ☐ | ☐ |
| free_time_ledger | ✅ | ✅ | ✅ | ☐ | ☐ |
| character_background (lifepath k/v) | ✅ | ✅ | ✅ | ☐ | ☐ |

Skills util (`src/lib/skills.ts`) + tests ✅ — 11 tests, incl. the 4 spec cases + DEX fix.

## Screens (built / themed / data-driven / self-test)
| Tab | Built | Realtime | Notes |
|---|---|---|---|
| Home | ✅ | ✅ (auto) | hero, nameplate, HP/Humanity, mission, news |
| Profile (+Background slide) | ☐ | ☐ | stats, vitals, top skills, chrome; slide page |
| Inventory | ☐ | ☐ | category subtabs, 4-up grid, detail panel |
| Store | ☐ | ☐ | status bar, subtabs, grid, cart (view-only) |
| Activities | ☐ | ☐ | free-time card, standard list, random board |
| Contacts | ☐ | ☐ | channel list, thread area, compose (display) |
| Story So Far | ☐ | ☐ | ribbon ↔ vertical detail |

## Shared primitives
- [x] Panel, Card, SectionHeader, StatChip, VitalBar, Segmented, SkillRow, CategoryTabs, Pill, Avatar, IconBox, NavRail (`src/app/ui/`)
- [x] icon set (`src/app/ui/icons.tsx`), portal.css visual language, tokens (gradients/insets)
- [x] asset registry (id → source; temp placeholders) — `src/app/assets.ts`
- [x] data hooks + realtime (`src/features/portal/data.ts`); click-to-roll (`roll.tsx`)
- [x] skills util (level + gov stat) + unit tests

## Known reconciliations (mock vs sheet → sheet wins)
- Brawling/Martial Arts/Melee Weapon are **DEX** (Phase 0 seed had REF) — fixed in 0003.
- Ammo: seed the real split (Basic HP ×118, Shotgun ×24, Slug ×30, Improved Smart HP ×7, Smart HP ×10); mock merged smart→×17.
- Story title: use "Sandy Gone Psycho!" (data blob), not ribbon's "Sandy Psycho".
- Stage is 1600×**900** (mock authored at 1000) — port layout/concept, re-fit coords to 900.
