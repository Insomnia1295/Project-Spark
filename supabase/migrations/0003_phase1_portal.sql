-- NETRUN OS — Phase 1: Player Portal read-path data model.
-- Adds every content entity the 7 read-only tabs render (SCHEMA-PATTERN.md: each is
-- table -> RLS -> row type -> Zod -> consume). Writes stay GM-only this phase; player
-- self-edits arrive in Phase 2. All PC data reconciled to Docs/reference/Steven Heartman.pdf.
--
-- Permission shape:
--   owner-scoped tables  -> player reads OWN rows; GM reads/writes all.
--   reference/global     -> any authenticated user reads; GM writes.

-- ---------------------------------------------------------------------------
-- character_sheet — extra display fields (handle, role, eddies)
-- ---------------------------------------------------------------------------
alter table public.character_sheet
  add column if not exists handle       text,
  add column if not exists role_title   text,   -- 'Medtech'
  add column if not exists role_line    text,   -- 'MEDTECH · RIPPER-DOC MERC'
  add column if not exists role_ability text,   -- 'Medicine'
  add column if not exists role_rank    int,
  add column if not exists eddies       int not null default 0 check (eddies >= 0);

-- ---------------------------------------------------------------------------
-- skill_def corrections + additions (reconciled to Steven's sheet)
--   RED Fighting skills are DEX-governed; Phase 0 mapped a few to REF.
-- ---------------------------------------------------------------------------
update public.skill_def set gov_stat = 'DEX' where name in ('Brawling', 'Martial Arts', 'Melee Weapon');

insert into public.skill_def (name, gov_stat, category) values
  ('Drive Land Vehicle', 'REF', 'Control'),
  ('Language',           'INT', 'Education'),
  ('Local Expert',       'INT', 'Education')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- skill — per-character skill LEVELS (display total = level + governing stat)
-- ---------------------------------------------------------------------------
create table public.skill (
  id           uuid primary key default gen_random_uuid(),
  owner        uuid not null references public.profiles (id) on delete cascade,
  skill_def_id uuid not null references public.skill_def (id) on delete cascade,
  spec         text,                              -- specialization (Language: "Native"; Local Expert: "Corpo")
  level        int not null default 0 check (level between 0 and 10),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index skill_owner_def_spec_idx
  on public.skill (owner, skill_def_id, coalesce(spec, ''));
create index skill_owner_idx on public.skill (owner);
create trigger skill_touch before update on public.skill
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- cyberware — installed chrome
-- ---------------------------------------------------------------------------
create table public.cyberware (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null references public.profiles (id) on delete cascade,
  name       text not null,
  slot       text not null default 'Internal',
  detail     text,
  sort       int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cyberware_owner_idx on public.cyberware (owner);
create trigger cyberware_touch before update on public.cyberware
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- inventory_item — loadout & stash
-- ---------------------------------------------------------------------------
create table public.inventory_item (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null references public.profiles (id) on delete cascade,
  name       text not null,
  category   text not null check (category in ('weapon','armor','utility','implant','junk')),
  subtitle   text,                                -- 'Heavy Pistol', 'SP 11', 'Basic'
  qty        int not null default 1 check (qty >= 0),
  equipped   boolean not null default false,
  detail     text,                                -- description shown in the detail panel
  damage     text,                                -- '3d6'
  rof        int,
  mag        text,                                -- '14'
  sort       int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inventory_item_owner_idx on public.inventory_item (owner);
create trigger inventory_item_touch before update on public.inventory_item
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- contact — encrypted-channel list (Contacts tab)
-- ---------------------------------------------------------------------------
create table public.contact (
  id           uuid primary key default gen_random_uuid(),
  owner        uuid not null references public.profiles (id) on delete cascade,
  name         text not null,
  relationship text not null default 'Friend',   -- Friend / Love / ...
  online       boolean not null default false,
  sort         int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index contact_owner_idx on public.contact (owner);
create trigger contact_touch before update on public.contact
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- mission — the player's current mission (Home)
-- ---------------------------------------------------------------------------
create table public.mission (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  status     text not null default 'current' check (status in ('current','done','failed')),
  sort       int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index mission_owner_idx on public.mission (owner);
create trigger mission_touch before update on public.mission
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- free_time_ledger — free-time economy (Activities)
-- ---------------------------------------------------------------------------
create table public.free_time_ledger (
  id             uuid primary key default gen_random_uuid(),
  owner          uuid not null references public.profiles (id) on delete cascade unique,
  hours_remaining int not null default 0 check (hours_remaining >= 0),
  hours_total     int not null default 24 check (hours_total >= 1),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger free_time_ledger_touch before update on public.free_time_ledger
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- character_background — lifepath (Profile → Background slide). Key/value so the
-- UI renders labels from data, never from hard-coded JSX.
-- ---------------------------------------------------------------------------
create table public.character_background (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null references public.profiles (id) on delete cascade,
  slot       text not null,                       -- stable key (e.g. 'personality')
  label      text not null,                       -- display label
  body       text not null,
  sort       int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner, slot)
);
create index character_background_owner_idx on public.character_background (owner);
create trigger character_background_touch before update on public.character_background
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- activity — standard (global, owner null) + random (assigned, owner set)
-- ---------------------------------------------------------------------------
create table public.activity (
  id            uuid primary key default gen_random_uuid(),
  owner         uuid references public.profiles (id) on delete cascade,   -- null = global standard
  kind          text not null check (kind in ('standard','random')),
  name          text not null,
  hour_cost     int check (hour_cost >= 0),
  icon          text,                              -- registry id for the row icon
  with_contact  text,                              -- random: "Kane Shand"
  reward        text,                              -- random: "Unwind · +Bond"
  skill_check   text,                              -- random: "Cool vs DV13"
  deadline_label text,                             -- random: "2d 14h"
  planned_label text,                              -- random: "PLANNED · TONIGHT"
  progress      int not null default 0 check (progress >= 0),
  progress_max  int not null default 0 check (progress_max >= 0),
  sort          int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index activity_owner_idx on public.activity (owner);
create trigger activity_touch before update on public.activity
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- news_post — City News / bulletins (Home). Global feed.
-- ---------------------------------------------------------------------------
create table public.news_post (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text not null,
  kind       text not null default 'bulletin',
  sort       int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger news_post_touch before update on public.news_post
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- timeline_event — Story So Far (global campaign timeline)
-- ---------------------------------------------------------------------------
create table public.timeline_event (
  id         uuid primary key default gen_random_uuid(),
  session_no int not null,
  title      text not null,
  date_label text not null,                        -- '06 MAR 2076'
  summary    text not null,                        -- ribbon blurb
  full_text  text not null,                        -- vertical detail write-up
  sort       int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger timeline_event_touch before update on public.timeline_event
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- catalog_item — store catalog (global)
-- ---------------------------------------------------------------------------
create table public.catalog_item (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  category   text not null check (category in ('weapon','armor','utility','implant')),
  subtitle   text,
  price      int not null check (price >= 0),
  sort       int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger catalog_item_touch before update on public.catalog_item
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- store_settings — single-row store state (global)
-- ---------------------------------------------------------------------------
create table public.store_settings (
  id         uuid primary key default gen_random_uuid(),
  singleton  boolean not null default true unique check (singleton),
  is_open    boolean not null default false,
  closes_at  timestamptz,                          -- null = no countdown shown
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger store_settings_touch before update on public.store_settings
  for each row execute function public.touch_updated_at();

-- ===========================================================================
-- Row-Level Security
-- ===========================================================================
alter table public.skill                enable row level security;
alter table public.cyberware            enable row level security;
alter table public.inventory_item       enable row level security;
alter table public.contact              enable row level security;
alter table public.mission              enable row level security;
alter table public.free_time_ledger     enable row level security;
alter table public.character_background enable row level security;
alter table public.activity             enable row level security;
alter table public.news_post            enable row level security;
alter table public.timeline_event       enable row level security;
alter table public.catalog_item         enable row level security;
alter table public.store_settings       enable row level security;

-- Owner-scoped: player reads OWN; GM reads/writes all. (No player writes this phase.)
do $$
declare t text;
begin
  foreach t in array array[
    'skill','cyberware','inventory_item','contact','mission',
    'free_time_ledger','character_background'
  ] loop
    execute format('create policy %I on public.%I for select using (owner = auth.uid());',
                   t || ' read own', t);
    execute format('create policy %I on public.%I for select using (public.is_gm());',
                   t || ' read all gm', t);
    execute format('create policy %I on public.%I for all using (public.is_gm()) with check (public.is_gm());',
                   t || ' gm all', t);
  end loop;
end $$;

-- activity: global standard (owner null) OR own random OR GM.
create policy "activity read" on public.activity for select
  using (owner is null or owner = auth.uid() or public.is_gm());
create policy "activity gm all" on public.activity for all
  using (public.is_gm()) with check (public.is_gm());

-- Reference/global: any authenticated user reads; GM writes.
do $$
declare t text;
begin
  foreach t in array array['news_post','timeline_event','catalog_item','store_settings'] loop
    execute format('create policy %I on public.%I for select using (auth.role() = ''authenticated'');',
                   t || ' read', t);
    execute format('create policy %I on public.%I for all using (public.is_gm()) with check (public.is_gm());',
                   t || ' gm write', t);
  end loop;
end $$;

-- ===========================================================================
-- Realtime — publish the tables each tab reads so GM edits reflect live.
-- ===========================================================================
alter publication supabase_realtime add table
  public.character_sheet,
  public.skill,
  public.cyberware,
  public.inventory_item,
  public.contact,
  public.mission,
  public.free_time_ledger,
  public.character_background,
  public.activity,
  public.news_post,
  public.timeline_event,
  public.catalog_item,
  public.store_settings;

insert into public.content_version (kind, version) values ('phase1', 1)
on conflict (kind) do update set version = public.content_version.version + 1,
                                 updated_at = now();
