# Cyberpunk RED — Player Portal
## Planning & Build Plan — v0.6 (Decisions Locked)

Companion app for a 5-player Cyberpunk RED campaign · Featured PC: Steven "Doc" Heartman (Medtech / Ripper-Doc Merc) · In-world date 3 July 2076 · Working title NETRUN OS / "Project Spark"

**How to use this doc.** Supersedes v0.5 (which superseded v0.4). It keeps everything in v0.5 and locks the outstanding decisions: **2D only (no 3D anywhere), server-authoritative rolls, corrected grid logic (fixed 1 m/square — presets only resize the squares), manual combat assistant for v1 with animations as later polish, RAW crits (no chaining), in-app-only notifications, Reputation tracked-but-hidden, and free-tier Supabase.** It also keeps everything in v0.4 (stack, permissions, skills+stat totals, dice/RNG, phased build) and folds in this pass's additions: **player-to-player messaging, multiplayer/co-op quests, a live Session combat arena, a shared combat-sheet + initiative system (modelled on your reference screenshots — layout/concept only, not their styling), a categorized asset library, and an optimal re-framing of the quest/activity maker.** The HTML file remains a **visual reference only** — design/backgrounds are not frozen.

Tags: **LOCKED** · **NEW v0.5** · **NOTE** · **OPEN**.

---

## 0 · What changed since v0.4

| Area | v0.4 | v0.5 NEW |
|---|---|---|
| Combat | Two implied systems (Paper-Mario quest combat + tactical) | **One unified Combat/Encounter system**, two entry points: the live **Session arena** and authored **quest combat nodes** (§5) |
| Live play | "Fetch on launch" sync | **Real-time collaborative sessions** — a shared arena that reflects live for everyone joined (§3.4, §6) |
| Session tab | — | **New tab: Session** — a live grid combat arena the GM sets up and players join (§6) |
| Combat sheet | Sketched | **Full spec** from your reference images: weapons/attack/reload/damage, skill rolls, apply-damage w/ armor math, critical injuries, dice roller (§5.1) |
| Initiative | "initiative order" | **Full initiative/turn system**: GM Start/Clear, roll+sort, turn arrows, per-combatant HP (§5.2) |
| Quests | Single-player | **Multiplayer + co-op quests**: invite another player, co-op-locked variants, extra character joins with own combat sheet (§9) |
| Messaging | Player↔GM-as-NPC | **+ Player-to-player DMs** in Contacts (§10) |
| Maker | "4 layers" | **Optimal node-graph + composable-layers model** (your 4 layers, reframed) (§7) |
| Assets | Implicit | **Categorized asset library** as a first-class shared subsystem (§8) |
| Quest/arena display | Unspecified | **Full-screen, in-app** (never leaves the app), fitted to the backdrop/pixel map (LOCKED, §3.5) |

---

## 1 · Product recap

One codebase, two surfaces, one always-on cloud DB — now with a live collaborative layer.

- **Player Portal ×5** — native desktop app; read-mostly view + a small set of self-edits (§4.1); can join **live sessions** and **co-op quests**; can DM the GM (as NPCs) and other players.
- **GM Admin / Master Control** — same shell + full edit access, the **NPC manager**, the **no-code Quest/Activity maker**, and the **Session arena** authoring/running controls.
- **Cloud DB + realtime (Supabase)** — GM edits push live; player self-edits write back live; **live sessions** share ephemeral state (token positions, initiative, HP) across everyone joined.

```
Player PC ×5  ↔  [ Supabase: Postgres · Auth · Realtime(Broadcast/Presence) · Storage · Edge Functions ]  ↔  Admin PC
```

---

## 2 · Tech stack — still the same core, one addition

Unchanged from v0.4, plus the real-time collaboration primitives the arena needs. **No new engine.**

| Layer | Choice | Note |
|---|---|---|
| Desktop shell | **Tauri 2** | Tiny, light, built-in updater. |
| UI framework | **React + TypeScript + Vite** | The mock's shape; typed + interchangeable. |
| UI animation | **Framer Motion** + CSS | Smooth HUD/slide transitions. |
| Game/board renderer | **PixiJS v8** | 2D board, tokens, sprite worlds, combat visuals; mounts full-screen per quest/session, unmounts on exit. |
| **Live collaboration** | **Supabase Realtime — Broadcast + Presence** | **NEW.** Presence = who's joined; Broadcast = high-frequency ephemeral events (token drags, dice reveals); Postgres change-subscriptions = authoritative state (HP, initiative order, final positions). |
| 3D | **None** | **LOCKED: there is no 3D anywhere in this project.** Everything — arena maps, quest backdrops, combat — is 2D (image/pixel/tilemap). |
| State (client) | **Zustand** + **TanStack Query** | Local + server-state. |
| Backend | **Supabase** | Postgres · Auth · Realtime · Storage (assets) · Edge Functions (authoritative dice, privileged writes). |
| Validation | **Zod** | Every JSON entity validated; backbone of "not hard-coded." |
| Editors | **React + dnd-kit** | No-code drag-drop; emit the JSON the runtime/arena play. |
| Assets | **Aseprite → sheet+atlas**, Supabase Storage, referenced by ID | Swap art without code. |
| Dice/RNG | Dedicated module + Edge Function | §4.3. |
| Distribution | **Tauri updater + GitHub Releases** | Free auto-update. |

**Why this still holds under the bigger scope:** the live arena is a 2D board with tokens + shared state — squarely PixiJS + Supabase Realtime. Nothing here needs Unity/Godot, and keeping it web-native means one language, one asset pipeline, and a light footprint. The only genuinely new capability is **real-time multi-user state**, which Supabase provides natively (Broadcast/Presence).

---

## 3 · Architecture principles

### 3.1 Data-driven everything (interchangeability)
Backgrounds, tilemaps, sprites, NPCs, quests, encounters, combat actions, the skill→stat map, dice config, grid presets, store catalog — all **JSON validated by Zod, stored in Supabase**, referenced by ID. Editors produce it; runtimes play it. You can hand-author one encounter as JSON to test the arena before the editor exists.

### 3.2 One combat system, two entry points — NEW v0.5
Rather than two combat implementations, there is **one Encounter system** (§5) built from shared modules: **board model** (grid, tokens, movement budgets — renderer-agnostic), **initiative/turn model**, **combat sheet** (weapons/skills/dice/apply-damage/critical-injuries/armor), and **live sync**. It is entered two ways:
- **Session tab** — an ad-hoc live encounter the GM spins up (§6).
- **Quest combat node** — an authored encounter placed inside a quest that drops into the same system with pre-placed combatants and the quest's map (§7, §9).

"Paper Mario-style" attack animations are a **presentation layer added later** on top of this system — the manual VTT you want now and the animated combat later are the same engine at different fidelity, so no work is wasted.

### 3.3 Quest = node graph; layers = per-node stage — NEW v0.5
Your "4 layers" become a cleaner, more flexible model (details §7): a quest/activity is a **graph of beats (nodes)**; each node composes optional **layers** (backdrop, actors, dialogue, combat) and is one of a few **kinds** (Dialogue, Choice, Map, Combat). Choices branch the graph. Enable only the layers a node needs.

### 3.4 Real-time collaborative layer — NEW v0.5
Live sessions share state across everyone joined: **Presence** tracks who's in; **Broadcast** carries transient events (a token being dragged, a dice roll revealing); **Postgres subscriptions** carry authoritative state (HP, initiative order, committed positions). Consequential rolls (initiative, attacks) resolve **server-authoritative** via an Edge Function so results are trusted and can't be tampered locally.

### 3.5 In-app, full-screen play — LOCKED
Quests and the Session arena open **full-screen inside the app** (never a separate window/browser), fitted to the backdrop or pixel map. The HUD yields to the stage; a back control returns to the normal app.

### 3.6 Design rules carried from v0.3/v0.4 (still LOCKED)
No overlap/touch; f1c angular nav; tokens `--p1 #ff5aa8 / --p1d #7a1f52 / --p2 #9a6cff`; hero 660px; Corpta DEMO display/nav + Inter Light 300 body; unique asset tokens in any string-replace. These become the React theme — portable, not frozen.

---

## 4 · Cross-cutting systems

### 4.1 Permission matrix (RLS-enforced)
Players may edit **only**: cash, HP (own), skills (add/increase only, IP-gated ×10), inventory, contacts, profile-background. In a live session they may also **move their own token** and **edit their own HP**. Everything else (STATS, max HP/Humanity/Death Save, cyberware, IP grants, news/mission/timeline, store toggle/catalog, quests/activities/NPCs/scenes/maps, other combatants' HP/positions, initiative) is **GM-only**. RLS enforces it server-side; the UI merely hides locked controls.

### 4.2 Skills = level + governing stat (auto-total + click-to-roll)
Displayed skill value = level + governing stat (the sheet's third column is already this total), auto-recomputed on level change. Validated vs Steven (INT 8 · REF 6 · DEX 4 · TECH 8 · COOL 7 · WILL 5 · LUCK 7 · MOVE 3 · BODY 8 · EMP 7): Education 6+INT8=**+14**, Conversation 6+EMP7=**+13**, Persuasion 5+COOL7=**+12**, Concentration 2+WILL5=**+7**. Governing-stat map is an editable data table (see v0.4 §4.2 for the full category→stat list). Same auto-total applies to **NPCs** and to the **combat sheet's** derived rolls (Facedown/Initiative/Evasion).

### 4.3 Dice / RNG
High-quality algorithm, two tiers: seedable **xoshiro256\*\*/PCG** for previews/tests (reproducible); **CSPRNG via Supabase Edge Function** for consequential rolls (initiative, attacks, skill checks) so a client can't tamper — the client only animates the returned number (**server-authoritative, LOCKED**). CP RED resolution: `1d10 + STAT + SKILL + mods` vs DV; nat 10 → +1d10 once; nat 1 → −1d10 once. **LOCKED: RAW crits — the exploding die does NOT chain (a second 10 does not explode again), and there is no house-rule toggle.** Weapon damage rolls (`Nd6`), Xd6, and 2d6 crit-table rolls all go through the same module. A **roll history/log** is kept per session.

### 4.4 Notifications & delivery model — LOCKED v0.6
**No OS/Windows notifications, ever — everything is in-app only.** The app never sends anything to the Windows notification center. Instead, an **in-app toast** appears:
- **Placement:** **bottom-center**, ~**half the app width**, centered; a wide-but-short bar.
- **Duration:** appears for a short time, then auto-dismisses.
- **Triggers:** (a) a **quest invite** from another player, and (b) a **new message** (GM-as-NPC → player, or player → player).
- **Click behavior:** tapping the toast **navigates the user from wherever they are** to the relevant place — the **side-quest page** to join an invite, or the **chat thread** for a message.
- **Suppression:** toasts **never appear while the user is inside an activity or side-quest** (don't interrupt play) — they surface afterward.
- **Catch-up:** **pending invites are also listed in the Quests tab**, and unread messages in Contacts, so anything missed while offline is visible on next open.

**Delivery:** live when the recipient is online (Supabase Realtime); otherwise the message/invite **persists in the DB and surfaces on next open**. Because apps aren't always running, real-time "join now" coordination still happens **out-of-band** (call / in person) — the in-app toast only fires for users who are already in the app.

### 4.5 Board, grid & movement model — CORRECTED & LOCKED v0.6
Renderer-agnostic **board model**: a map (image or tilemap) + tokens at grid coordinates. **Grid overlay** is a **per-user display toggle** (thin white squares; toggling only affects that user's own view).

**Key rule:** **every square is 1 meter — always, for every preset.** The meters-per-square value does **not** change between presets (it's a single global value, adjustable by the GM later; default 1 m). The **only** thing a preset changes is **how big the squares are drawn** on the map, i.e. grid density:

| Preset | Square draw size | Squares across the map | Effect on the same map |
|---|---|---|---|
| **Small map** | **Large squares** | Fewer squares tile the map | A MOVE of N metres = N squares covers **more** of the map — the map reads as a small space, characters move further across it |
| **Medium map** | Smaller squares | More squares tile the map | Same MOVE = N squares covers **less** of the map |
| **Large map** | Smallest squares | Most squares tile the map | Same MOVE = N squares covers the **least** of the map — the map reads as a large space |

So the preset is effectively the **map's scale**: bigger squares → fewer of them → each metre of MOVE spans more of the picture; smaller squares → more of them → each metre spans less. The character's MOVE never changes; what changes is how much of the visible map one metre represents.

**Movement budget** per turn = `MOVE (m) ÷ metres-per-square` = squares reachable (so at the default 1 m/square, budget = MOVE squares, regardless of preset). Players move their **own** token via **WASD** or **click-drag**, freely within the remaining budget from their **turn-start position** (no position lock — they may re-move as long as total ≤ budget). The GM moves any token freely. Active injuries modify MOVE (e.g., Broken Leg −4, min 1) and thus the budget.

### 4.6 Performance & smoothness budget
HUD/slides at 60fps, GPU-composited (transform/opacity only). In-arena Pixi targets 60fps with a packed atlas per map, token pooling, and canvas teardown on exit. Idle app runs no game loop. Broadcast movement is throttled/interpolated for smooth remote token motion.

---

## 5 · The unified Combat / Encounter system — NEW v0.5

Modelled on your reference screenshots for **layout and concept only** (not their colors/styles/art). Three shared modules, used by both the Session arena (§6) and quest combat nodes (§7/§9).

### 5.1 Combat sheet (per combatant; also the NPC/PC character view)
A compact character view with sub-tabs **BIO · STATS · GEAR · AGENT · COMBAT**. Header shows name, **HP current/max** (editable per permission), and portrait. The **COMBAT** tab is the action surface:

- **Editable defenses (top):** Body Armor SP (±), Head Armor SP (±), Initiative (±).
- **Active critical injuries** with effect text + icon (e.g., "Broken Leg — −4 to MOVE (min 1)").
- **Character Visibility** (GM): Default / Hidden — controls whether the token + sheet are visible to players (for hidden NPCs).
- **Weapons list:** each row = circular **ammo counter** (current/max), name, **damage dice + ammo type** (e.g., 5d6 Improved Smart Slugs), and an **Actions** menu → **Attack** (to-hit roll), **Reload**, **Damage** (damage roll).
- **Melee** (e.g., Brawling 3d6) with the same Actions.
- **Derived/skill rolls** as one-tap dice chips showing the computed modifier and rolling on tap: **Facedown** (1d10 + COOL + REP*), **Initiative** (1d10 + REF), **Evasion** (1d10 + DEX). *REP is data-defined; if not tracked it's 0 and can be hidden.
- **Footer:** **Critical Injuries** (opens the table) · **Apply Damage** (opens the flow).
- **Dice roller (floating):** quick d10, Xd6, and **Roll History**.

**Apply Damage flow:** enter damage (± / keypad) → choose mitigation: **Full Armor SP** (ranged) / **Half Armor SP** (martial arts & melee) / **Ignore Armor** (choke & throw) → optional **Double Damage** (aimed head shot) → **Next** applies to HP after armor and **ablates armor SP by 1** per RED, and records the event.

**Critical Injuries screen:** a checklist of RED injuries to apply/remove, plus **Body** and **Head** buttons that roll (2d6) on the respective RED critical-injury table and auto-apply the result. Applied injuries feed the sheet's active-effects (and MOVE budget, §4.5). *(Injury tables are entered as editable data, not hard-coded.)*

### 5.2 Initiative / turn system
A **roster** (the right-side view over the arena map, or a standalone panel in quest combat). Each row: initiative number, character + player name, **HP + Head/Body armor** readouts, portrait; **current turn highlighted**. A banner shows **current turn + up next** with **◀ ▶** arrows to step turns.

- **Start Initiative** — **GM-only, visible only to the GM.** Rolls **1d10 + REF** for every combatant, sorts **high→low**, assigns order. The button then becomes **Clear Initiative**; clearing prompts an **"are you sure?" yes/no** confirm.
- **Turn advance** — GM steps ◀ ▶; the banner names the current character.
- **HP** — displayed for all; **GM edits anyone's**, **players edit only their own**.
- A player can **open their own combat sheet from the roster and keep it open the whole time**, regardless of whose turn it is.

### 5.3 What's automated now vs later — LOCKED v0.6
**v1 (LOCKED): a fast manual assistant.** It tracks initiative/turns/HP/armor, rolls dice honestly (server-authoritative), does the apply-damage armor math, and logs critical injuries — exactly like the reference companion app. It does **not** auto-resolve attacks or auto-move tokens; the humans decide and act. **Later (Phase 14 polish, non-blocking):** optional Paper-Mario-style attack/hit/faint sprite animations layer on top of the same encounter data. (Optional auto-resolution is a *maybe-later*, not planned for v1.)

---

## 6 · Session tab — the live combat arena — NEW v0.5

A new bottom-nav tab. Opening it **redirects to a full-screen in-app arena** shared live with everyone joined.

- **Map:** GM picks a 2D map (image png/gif or tilemap/pixel) from the asset library and **drops tokens** (PCs/NPCs) onto it.
- **Grid:** per-user overlay toggle + fixed 1 m/square + draw-size presets (§4.5).
- **Movement (v1, no turn-based auto-combat on the map):** players move **their own** token (WASD or click-drag) within their **movement budget** from turn-start; GM moves anyone freely (§4.5).
- **Roster + initiative (§5.2):** the right-side view lists every joined combatant with portrait + HP; **Start/Clear Initiative** (GM-only) and **turn arrows** live here.
- **Combat sheet (§5.1):** a player taps their roster entry to open their full sheet, kept open regardless of turn; the GM can open anyone's.
- **Live sync:** Presence (joined), Broadcast (token drags, dice reveals), Postgres (authoritative HP/positions/initiative). Everyone's view stays consistent.
- **HP edits:** GM anyone; players only their own (§4.1).

This same arena is what a **quest combat node** and a **co-op quest** drop into (§7, §9) — one system.

---

## 7 · The no-code Quest / Activity maker — optimal model — NEW v0.5

Your 4 layers, reframed for flexibility and reuse. **A quest/activity is a graph of nodes (beats); edges are choices.** Each node composes only the **layers** it needs, and is one **kind**:

**Layers (compose per node):**
- **Backdrop** — an image (static/animated png/gif) **or** a tilemap/pixel map. *(Your Layer 1 + Layer 3, unified: pick one backdrop type per node.)*
- **Actors** — placed characters (PC/NPC), rendered either as **bust-up expression portraits** (VN scenes) or **sprite tokens** (map/combat), referencing that character's expression set / sprite sheet. *(Your Layer 2 art + Layer 3 characters.)*
- **Dialogue** — per-beat lines with expression changes, and **player multiple-choice options** you write; each choice **branches** to another node. *(Your Layer 2 text + branching.)*
- **Combat** — promotes the node into a tactical **Encounter** (§5), pulling placed actors' combat sheets, on the node's map. *(Your Layer 4.)*

**Node kinds:** **Dialogue**, **Choice** (branches), **Map/Exploration** (free movement), **Combat** (§5). You enable only the layers you need — most nodes won't need all of them.

**Authoring features:** categorized **asset-library** pickers (§8); a visual **branch graph**; **save as template**; **character-swap** via dropdown (author once, retarget to another PC); **assign/publish** to a player or players; **multiplayer flags** (§9); per-node **skill-check** and **outcome effects** (write to sheet). The editor emits the exact JSON the quest runtime and arena play **unmodified**.

**Standard activities** use the same maker but are deterministic (no dice), hour-costed, short, and write effects on completion.

---

## 8 · Asset library — NEW v0.5

A first-class, **categorized** media library shared across quests, NPCs, and the arena. Categories/tags for **backgrounds, tilemaps/pixel maps, portrait/expression sets, sprite sheets, props, SFX**. GM uploads to Supabase Storage; everything references assets **by ID**, so art swaps never touch code. Expression sets and sprite sheets attach to characters/NPCs (before or after creation) and are pickable in the maker and arena.

---

## 9 · Multiplayer & co-op quests — NEW v0.5

- **Setup (GM):** at quest creation, a quest can be flagged **multiplayer** and optionally **co-op-required** (locked until the required players run it **together, at the same time**).
- **Invite (in-app):** a player opens a shared quest instance and **invites** another; the invitee **joins** if the quest allows multiplayer. Invites persist in the DB and surface on open (delivery caveat §4.4) — real-time "join now" coordination happens **out-of-band** (call/in person).
- **In combat:** each joined player's character appears in the shared encounter with **their own combat sheet**; the roster shows everyone; each player primarily controls **their own** token + sheet (GM sees/controls all).
- **Under the hood:** a co-op quest's combat node opens a **shared live arena instance** (§6) the invited players join — the same unified system, so multiplayer is a property of the encounter, not a separate build.

---

## 10 · Contacts & messaging — NEW v0.5

Two channel types in the Contacts tab:
- **Player ↔ GM-as-NPC** (async) — player messages an NPC; routes to the GM; GM replies later as that NPC.
- **Player ↔ Player DMs** — **NEW.** Direct messages between players.

Both use Supabase Realtime when recipients are online and **persist for next-open** otherwise (no guaranteed push, §4.4). Unread badges/notifications are best-effort. Chats start empty; the contact list is populated from the sheet.

---

## 11 · Data model (expanded)

`player · character_sheet · stat · skill · skill_def(gov-stat map) · inventory_item · catalog_item · store_settings · contact · npc · npc_template · message(p2p + npc) · quest_invite · news_post · timeline_event · mission · free_time_ledger · activity · quest · quest_node · quest_edge(choice) · scene_backdrop · actor_placement · combat_sheet · weapon · combat_action · critical_injury · injury_table · encounter · combatant · initiative_order · board(map+grid) · token · session(live) · session_member(presence) · asset(bg/tilemap/expression-set/spritesheet/prop/sfx) · asset_category · scene_assignment · outcome_effect · dice_roll(log) · app_version/content_version`

All content entities are JSON-in-Postgres + Zod; assets by ID from Storage; live state via Realtime.

---

## 12 · Build phases

One phase = one major Claude Code prompt. Front-loads the data-driven foundation; builds the **shared combat modules before** the arena and quests so nothing is built twice; de-risks live sync early. Format per phase: **Goal · Scope · CC delivers + self-tests · You test.**

**Phase 0 — Foundations & skeleton** (Med). Tauri2+React+TS+Vite; `/portal` + `/admin`; Supabase + 6 accounts; migrations + Zod schemas; **dice/RNG module** + Edge Function; **Realtime channel scaffolding** (Presence/Broadcast smoke test); port the mock theme (tokens/fonts/nav/no-overlap); auto-update pipeline. *CC:* app launches, auth works, migrations apply, dice tests pass (distribution + crit/fumble + seeded reproducibility), a Presence/Broadcast round-trip works between two clients. *You:* launch, log in as player + GM, confirm the shell matches the mock and resizes cleanly.

**Phase 1 — Portal read path** (Med). All 7 tabs render from cloud (Steven's real data); **skill+stat auto-totals + click-to-roll**; **Profile→Background slide page**; realtime GM-edit reflection. *CC:* every tab renders from seeded rows; skill-total unit tests; realtime update without reload; slide/nav at 60fps. *You:* each screen vs mock+sheet; click a skill/stat to roll; open Background via slide; edit a value in Supabase and watch it update live.

**Phase 2 — Player self-edits + RLS** (Med). Enable only allowed edits (cash/HP/skills-add/inventory/contacts/background); RLS locks the rest; optimistic write-back. *CC:* RLS tests prove locked writes are rejected; skill upgrade enforces IP ×10 + add-only; edits sync to a second client. *You:* try allowed vs locked edits; add a skill level; change cash/HP; confirm sync to GM + a second player.

**Phase 3 — GM Admin CRUD + live push** (Med). GM edits any player's sheet/inventory/cash/stats/skills/IP + news/mission/timeline/contacts/free-time/store. *CC:* GM edit → player repaint <1s; write validation. *You:* push news, edit Steven's HP/stats, toggle store — confirm live on the player app.

**Phase 4 — Asset library** (Med). Categorized media library (bg/tilemap/expression-set/spritesheet/prop/sfx) to Storage; upload/tag/browse; reference-by-ID API. *CC:* upload + categorize + list + fetch-by-ID; Zod-validated asset records. *You:* upload a background, a pixel map, and an expression set; confirm categories + retrieval.

**Phase 5 — NPC manager** (Med). Templates → modify → **subtab sheet view** (skill totals auto-calc); attach assets from the library (before/after creation); combat-flagged NPCs carry combat stats/actions. *CC:* create/edit from template; attach assets; NPC JSON validates; NPC selectable for encounters. *You:* build an NPC from a template, tweak stats, attach a couple of sprites, confirm it saves + is pullable.

**Phase 6 — Combat sheet + initiative core (shared)** (Hard). The §5 modules: combat sheet (weapons attack/reload/damage, derived rolls, editable armor/init, apply-damage w/ armor math + aimed double damage, critical-injuries table w/ Body/Head rolls + active effects, dice roller + history) and the initiative/turn system (roster, GM Start/Clear + confirm, roll+sort, turn arrows, permissioned HP). Server-authoritative rolls. *CC:* apply-damage math correct across all mitigation modes; crit-injury rolls apply effects; initiative rolls+sorts+steps; HP-edit permissions enforced; roll history logs. *You:* run a combat sheet manually — attack roll, reload, apply damage through armor, apply a critical injury, roll initiative for a small group, step turns.

**Phase 7 — Live Session arena** (Hard). New tab → full-screen in-app board; GM picks map + drops tokens; **per-user grid toggle + meters-per-square + presets**; **WASD/drag movement w/ budget logic** (players own token only, GM anyone); integrates Phase 6 roster + sheets; **live sync** (Presence/Broadcast/Postgres). *CC:* two+ clients see consistent token positions, HP, initiative in real time; movement respects budget from turn-start; grid presets change reachable squares; GM-only Start/Clear works. *You:* set up a map, drop yourself + an NPC, join from a second client, drag/WASD-move within budget, toggle grid, run Start Initiative, step turns, edit HP.

**Phase 8 — Quest runtime (node-graph VN engine)** (Hard). Plays a hand-authored quest: backdrop (image/tilemap) + actor **portraits** + dialogue + **branching choices** + **skill-check nodes** (server dice) → **outcome effects → sheet**; full-screen in-app. *CC:* plays a provided sample graph; choices branch; skill-check branches on pass/fail; outcomes write to sheet; 60fps; canvas tears down on exit. *You:* play the sample quest, make a branching choice, pass/fail a check, confirm the reward/penalty on the sheet.

**Phase 9 — Quest combat node + co-op** (Hard). A combat node drops into the Phase 6/7 encounter system with **pre-placed combatants + the quest's map**; **multiplayer/co-op**: quest multiplayer flag + co-op-required lock; in-app **invite/lobby**; joined players appear with their own combat sheets. *CC:* an authored combat node opens the shared arena with the right combatants; a second player can be invited and joins; co-op-locked quest refuses solo start; delivery caveat honored (invite persists). *You:* author a small combat encounter, invite a second player, both drop into the shared arena and act from your own sheets.

**Phase 10 — No-code Quest/Activity maker (editor)** (Hardest — sub-divides). Node-graph authoring; per-node **layers** (backdrop/actors/dialogue/combat); asset-library pickers; branch graph; skill-check + outcome fields; **templates**, **character-swap**, **assign/publish**, **multiplayer flags**. Emits JSON the Phase 8/9 runtimes play **unmodified**. *CC:* editor output validates and round-trips (author → publish → play) with no hand-editing; drag-drop placement; template save+assign. *You:* build a small quest (backdrop + dialogue + a branch + a combat) with no code, assign it to Steven, and play it. *(Expect sub-prompts: VN/dialogue editor, map/actor editor, combat editor, publish/assign.)*

**Phase 11 — Contacts & messaging** (Med). Player↔GM-as-NPC async **+ player↔player DMs**; unread/notifications (best-effort); realtime when online, persist-for-next-open otherwise. *CC:* send/receive both channel types; routing; unread state; delivery caveat behavior. *You:* DM another player and message an NPC; reply as GM-as-NPC; confirm threading + surfacing on open.

**Phase 12 — Activities + free-time economy** (Med). Standard (deterministic, hour-cost, effects) + random/NPC-named activities run via the runtime; "go shopping" subset works store-off; attempts/deadlines/rewards. *CC:* activities deduct hours + write effects; random activity launches a quest; shopping works store-off. *You:* run a standard + a random activity; confirm hour spend + effects.

**Phase 13 — Store + catalog** (Med). Catalog CRUD; store-open toggle (~8h expiry); prices/availability; buy → inventory + eddies. *CC:* CRUD; toggle+expiry; purchase writes + cross-client sync. *You:* open store, buy an item, confirm inventory/cash on both clients.

**Phase 14 — Polish, performance, packaging, deploy** (Med). Animation polish (incl. optional **Paper-Mario attack/hit animations** on the encounter system, and smooth remote token interpolation); notifications; backups/keep-alive (Supabase Pro); signed installers; auto-update verified; Pixi perf pass (atlas/pooling/culling). *CC:* fps+memory benchmarks (idle, arena, combat); signed installers; auto-update round-trip. *You:* run on your machines; verify smoothness + update flow.

**Shape:** wins early (0–5) → shared combat core (6) → the two live/authored hard parts (7 arena, 8–9 quests+co-op) → the finale editor (10, sub-divides) → feature tabs (11–13) → polish (14).

---

## 13 · Decisions — now LOCKED

1. **No 3D.** There is no 3D anywhere. All maps/backdrops/combat are 2D (image/pixel/tilemap). three.js is not used.
2. **Roll authority: server-authoritative.** All consequential rolls resolve in a Supabase Edge Function; the client only animates the returned number. (The rejected option was rolling on the player's own PC, which a player could theoretically tamper with — hence server-side.)
3. **Grid: fixed 1 m/square; presets only resize the squares** (§4.5, corrected). Bigger squares → fewer of them → each metre of MOVE spans more of the map. Global metres-per-square is GM-adjustable later.
4. **Combat = manual assistant for v1.** No auto-resolution; humans roll/apply/move. Paper-Mario attack animations are optional Phase-14 polish (§5.3).
5. **Crits: RAW, no chaining, no toggle.** Nat 10 explodes once (+1d10); a second 10 does not explode again.
6. **Notifications: in-app only** (bottom-center toast, ~half app width, short, click-to-navigate, suppressed during quests; pending invites also in Quests tab). No OS/Windows notifications (§4.4).
7. **Reputation: tracked in the DB but hidden.** Stored and available to Facedown; not shown on Home vitals; not otherwise emphasized.
8. **Supabase: free tier.** See operating notes below.

### 13.1 Operating on the Supabase free tier — LOCKED v0.6
For a private 6-person campaign the scope fits the free tier comfortably. As of July 2026 the free tier includes a 500 MB database, 1 GB file storage, 5 GB egress bandwidth, 50,000 monthly active users, 500,000 edge function invocations, 200 concurrent realtime connections, and up to 2 active projects, plus 2 million realtime messages per month (256 KB max message size). Against our needs: 6 users vs 50k, ~6 concurrent realtime connections vs 200, and tiny dice Edge-Function calls vs 500k — all trivially within limits. Three habits keep us safely inside it:

- **Cache assets on the client.** Egress is the tightest meter; free-tier users hitting the 5 GB egress cap report every API request returning a 402 error, so download each sprite/map/background **once** and keep it on disk (Tauri local cache) rather than re-fetching per session. Compress before upload.
- **Mind the 1 GB storage + 50 MB/file cap.** Pixel art is tiny; keep animated-gif backgrounds reasonable. Free projects include 1 GB of file storage with a 50 MB maximum upload size per file.
- **Defeat the auto-pause + back up for free.** The real free-tier gotcha is that free-tier projects are paused after one week of inactivity (data survives; you resume from the dashboard). A tiny scheduled keep-alive request (e.g., a GitHub Actions cron) prevents it at $0. For backups, there's a documented free path: a step-by-step guide to automatically backing up your Supabase free tier database for free using GitHub Actions and Cloudflare R2.

Net: **$0/month**, no Pro plan needed. If assets ever balloon past ~1 GB or we outgrow egress, Pro is $25/mo — but we design to avoid that.

---

*End of v0.6. Companion file: app.html (visual reference). Reference screenshots informed the combat-sheet + initiative **layout/concept only**. All §13 decisions are locked. Next: "start Phase 0" and I'll write the first Claude Code prompt.*
