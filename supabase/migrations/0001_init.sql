-- NETRUN OS — Phase 0 schema spine.
-- Establishes the core tables + the RLS pattern the whole app follows.
-- (Full per-field permission matrix arrives in Phase 2; here we prove RLS works.)

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('gm', 'player');

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user, carrying the role
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         public.user_role not null default 'player',
  display_name text not null,
  created_at   timestamptz not null default now()
);

-- SECURITY DEFINER helper: is the current user a GM?
-- Runs as owner, so it bypasses RLS on profiles and avoids policy recursion.
create or replace function public.is_gm()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'gm'
  );
$$;

-- ---------------------------------------------------------------------------
-- character_sheet — the 10 RED stats + vitals
-- ---------------------------------------------------------------------------
create table public.character_sheet (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null references public.profiles (id) on delete cascade,
  name       text not null,
  stat_int   int not null check (stat_int between 1 and 10),
  stat_ref   int not null check (stat_ref between 1 and 10),
  stat_dex   int not null check (stat_dex between 1 and 10),
  stat_tech  int not null check (stat_tech between 1 and 10),
  stat_cool  int not null check (stat_cool between 1 and 10),
  stat_will  int not null check (stat_will between 1 and 10),
  stat_luck  int not null check (stat_luck between 1 and 10),
  stat_move  int not null check (stat_move between 1 and 10),
  stat_body  int not null check (stat_body between 1 and 10),
  stat_emp   int not null check (stat_emp between 1 and 10),
  hp         int not null default 0 check (hp >= 0),
  max_hp     int not null check (max_hp >= 1),
  humanity   int not null default 0 check (humanity >= 0),
  reputation int not null default 0 check (reputation >= 0), -- tracked but hidden (§13.7)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index character_sheet_owner_idx on public.character_sheet (owner);

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger character_sheet_touch
  before update on public.character_sheet
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- skill_def — skill -> governing stat map (reference data, §4.2)
-- ---------------------------------------------------------------------------
create table public.skill_def (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  gov_stat   text not null check (gov_stat in
              ('INT','REF','DEX','TECH','COOL','WILL','LUCK','MOVE','BODY','EMP')),
  category   text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- content_version — bump to signal clients that content changed
-- ---------------------------------------------------------------------------
create table public.content_version (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null unique,
  version    int not null default 1 check (version >= 0),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- dice_roll — authoritative roll log (written by the `roll` Edge Function)
-- ---------------------------------------------------------------------------
create table public.dice_roll (
  id         uuid primary key default gen_random_uuid(),
  roller     uuid references public.profiles (id) on delete set null,
  kind       text not null default 'generic',
  die        int not null,
  extra_die  int,
  modifier   int not null default 0,
  total      int not null,
  critical   boolean not null default false,
  fumble     boolean not null default false,
  detail     jsonb,
  created_at timestamptz not null default now()
);

create index dice_roll_created_idx on public.dice_roll (created_at desc);

-- ===========================================================================
-- Row-Level Security
-- ===========================================================================
alter table public.profiles        enable row level security;
alter table public.character_sheet enable row level security;
alter table public.skill_def       enable row level security;
alter table public.content_version enable row level security;
alter table public.dice_roll       enable row level security;

-- profiles: read own; GM reads all. No self role changes (GM-managed).
create policy "profiles read own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles read all (gm)"
  on public.profiles for select
  using (public.is_gm());

create policy "profiles gm write"
  on public.profiles for all
  using (public.is_gm())
  with check (public.is_gm());

-- character_sheet: a player reads/updates ONLY their own; GM reads/writes all.
-- (Phase 2 will narrow the player UPDATE to specific columns.)
create policy "sheet read own"
  on public.character_sheet for select
  using (owner = auth.uid());

create policy "sheet read all (gm)"
  on public.character_sheet for select
  using (public.is_gm());

create policy "sheet update own"
  on public.character_sheet for update
  using (owner = auth.uid())
  with check (owner = auth.uid());

create policy "sheet gm all"
  on public.character_sheet for all
  using (public.is_gm())
  with check (public.is_gm());

-- skill_def / content_version: reference data — any authenticated user reads;
-- only GM writes.
create policy "skill_def read"
  on public.skill_def for select
  using (auth.role() = 'authenticated');

create policy "skill_def gm write"
  on public.skill_def for all
  using (public.is_gm())
  with check (public.is_gm());

create policy "content_version read"
  on public.content_version for select
  using (auth.role() = 'authenticated');

create policy "content_version gm write"
  on public.content_version for all
  using (public.is_gm())
  with check (public.is_gm());

-- dice_roll: authenticated users may read the log; inserts happen via the Edge
-- Function using the service_role key (which bypasses RLS). No client inserts.
create policy "dice_roll read"
  on public.dice_roll for select
  using (auth.role() = 'authenticated');
