// NETRUN OS — hand-authored Supabase row types for the Phase 0 schema spine.
// Later phases can replace this with `supabase gen types typescript`, but keeping
// it explicit now documents the shape the migrations create.

export type Role = "gm" | "player";

export interface ProfileRow {
  id: string; // = auth.users.id
  role: Role;
  display_name: string;
  created_at: string;
}

export interface CharacterSheetRow {
  id: string;
  owner: string; // = profiles.id
  name: string;
  // The 10 Cyberpunk RED stats
  stat_int: number;
  stat_ref: number;
  stat_dex: number;
  stat_tech: number;
  stat_cool: number;
  stat_will: number;
  stat_luck: number;
  stat_move: number;
  stat_body: number;
  stat_emp: number;
  hp: number;
  max_hp: number;
  humanity: number;
  reputation: number;
  // Phase 1 display fields (nullable — filled by the Phase 1 seed)
  handle: string | null;
  role_title: string | null;
  role_line: string | null;
  role_ability: string | null;
  role_rank: number | null;
  eddies: number;
  created_at: string;
  updated_at: string;
}

// ---- Phase 1 content entities (all follow SCHEMA-PATTERN.md) ----

export interface SkillRow {
  id: string;
  owner: string;
  skill_def_id: string;
  spec: string | null;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface CyberwareRow {
  id: string;
  owner: string;
  name: string;
  slot: string;
  detail: string | null;
  sort: number;
  created_at: string;
  updated_at: string;
}

export type InventoryCategory = "weapon" | "armor" | "utility" | "implant" | "junk";

export interface InventoryItemRow {
  id: string;
  owner: string;
  name: string;
  category: InventoryCategory;
  subtitle: string | null;
  qty: number;
  equipped: boolean;
  detail: string | null;
  damage: string | null;
  rof: number | null;
  mag: string | null;
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface ContactRow {
  id: string;
  owner: string;
  name: string;
  relationship: string;
  online: boolean;
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface MissionRow {
  id: string;
  owner: string;
  title: string;
  status: "current" | "done" | "failed";
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface FreeTimeLedgerRow {
  id: string;
  owner: string;
  hours_remaining: number;
  hours_total: number;
  created_at: string;
  updated_at: string;
}

export interface CharacterBackgroundRow {
  id: string;
  owner: string;
  slot: string;
  label: string;
  body: string;
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityRow {
  id: string;
  owner: string | null;
  kind: "standard" | "random";
  name: string;
  hour_cost: number | null;
  icon: string | null;
  with_contact: string | null;
  reward: string | null;
  skill_check: string | null;
  deadline_label: string | null;
  planned_label: string | null;
  progress: number;
  progress_max: number;
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface NewsPostRow {
  id: string;
  title: string;
  body: string;
  kind: string;
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface TimelineEventRow {
  id: string;
  session_no: number;
  title: string;
  date_label: string;
  summary: string;
  full_text: string;
  sort: number;
  created_at: string;
  updated_at: string;
}

export type CatalogCategory = "weapon" | "armor" | "utility" | "implant";

export interface CatalogItemRow {
  id: string;
  name: string;
  category: CatalogCategory;
  subtitle: string | null;
  price: number;
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface StoreSettingsRow {
  id: string;
  singleton: boolean;
  is_open: boolean;
  closes_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface SkillDefRow {
  id: string;
  name: string;
  gov_stat: string; // e.g. "INT", "REF", ...
  category: string;
  created_at: string;
}

export interface ContentVersionRow {
  id: string;
  kind: string;
  version: number;
  updated_at: string;
}

export interface DiceRollRow {
  id: string;
  roller: string | null;
  kind: string;
  die: number;
  extra_die: number | null;
  modifier: number;
  total: number;
  critical: boolean;
  fumble: boolean;
  detail: Record<string, unknown> | null;
  created_at: string;
}

// Minimal typed schema map for the supabase-js generic.
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "created_at"> & { created_at?: string };
        Update: Partial<ProfileRow>;
      };
      character_sheet: {
        Row: CharacterSheetRow;
        Insert: Omit<CharacterSheetRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<CharacterSheetRow>;
      };
      skill_def: {
        Row: SkillDefRow;
        Insert: Omit<SkillDefRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<SkillDefRow>;
      };
      content_version: {
        Row: ContentVersionRow;
        Insert: Omit<ContentVersionRow, "id" | "updated_at"> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<ContentVersionRow>;
      };
      dice_roll: {
        Row: DiceRollRow;
        Insert: Omit<DiceRollRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<DiceRollRow>;
      };
      skill: {
        Row: SkillRow;
        Insert: Omit<SkillRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<SkillRow>;
      };
      cyberware: {
        Row: CyberwareRow;
        Insert: Omit<CyberwareRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<CyberwareRow>;
      };
      inventory_item: {
        Row: InventoryItemRow;
        Insert: Omit<InventoryItemRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<InventoryItemRow>;
      };
      contact: {
        Row: ContactRow;
        Insert: Omit<ContactRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ContactRow>;
      };
      mission: {
        Row: MissionRow;
        Insert: Omit<MissionRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<MissionRow>;
      };
      free_time_ledger: {
        Row: FreeTimeLedgerRow;
        Insert: Omit<FreeTimeLedgerRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<FreeTimeLedgerRow>;
      };
      character_background: {
        Row: CharacterBackgroundRow;
        Insert: Omit<CharacterBackgroundRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<CharacterBackgroundRow>;
      };
      activity: {
        Row: ActivityRow;
        Insert: Omit<ActivityRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ActivityRow>;
      };
      news_post: {
        Row: NewsPostRow;
        Insert: Omit<NewsPostRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<NewsPostRow>;
      };
      timeline_event: {
        Row: TimelineEventRow;
        Insert: Omit<TimelineEventRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<TimelineEventRow>;
      };
      catalog_item: {
        Row: CatalogItemRow;
        Insert: Omit<CatalogItemRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<CatalogItemRow>;
      };
      store_settings: {
        Row: StoreSettingsRow;
        Insert: Omit<StoreSettingsRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<StoreSettingsRow>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      role: Role;
    };
  };
}
