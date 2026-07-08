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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      role: Role;
    };
  };
}
