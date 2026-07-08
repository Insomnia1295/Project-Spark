// NETRUN OS — Zod schemas for the Phase 0 schema spine.
// PATTERN (see Docs/SCHEMA-PATTERN.md): every table has a Zod schema; data read from
// Supabase is validated at the boundary before the app trusts it. Nothing content-like
// is hard-coded — it is JSON validated by Zod.

import { z } from "zod";

export const roleSchema = z.enum(["gm", "player"]);
export type Role = z.infer<typeof roleSchema>;

export const profileSchema = z.object({
  id: z.string().uuid(),
  role: roleSchema,
  display_name: z.string().min(1),
  created_at: z.string(),
});
export type Profile = z.infer<typeof profileSchema>;

// The 10 Cyberpunk RED stats, each 1..10 (RED range).
const statValue = z.number().int().min(1).max(10);

export const characterSheetSchema = z.object({
  id: z.string().uuid(),
  owner: z.string().uuid(),
  name: z.string().min(1),
  stat_int: statValue,
  stat_ref: statValue,
  stat_dex: statValue,
  stat_tech: statValue,
  stat_cool: statValue,
  stat_will: statValue,
  stat_luck: statValue,
  stat_move: statValue,
  stat_body: statValue,
  stat_emp: statValue,
  hp: z.number().int().min(0),
  max_hp: z.number().int().min(1),
  humanity: z.number().int().min(0),
  reputation: z.number().int().min(0),
  handle: z.string().nullable(),
  role_title: z.string().nullable(),
  role_line: z.string().nullable(),
  role_ability: z.string().nullable(),
  role_rank: z.number().int().nullable(),
  eddies: z.number().int().min(0),
  created_at: z.string(),
  updated_at: z.string(),
});
export type CharacterSheet = z.infer<typeof characterSheetSchema>;

// Governing stat for a skill (plan §4.2). The set of valid stat codes is fixed.
export const statCodeSchema = z.enum([
  "INT",
  "REF",
  "DEX",
  "TECH",
  "COOL",
  "WILL",
  "LUCK",
  "MOVE",
  "BODY",
  "EMP",
]);
export type StatCode = z.infer<typeof statCodeSchema>;

export const skillDefSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  gov_stat: statCodeSchema,
  category: z.string().min(1),
  created_at: z.string(),
});
export type SkillDef = z.infer<typeof skillDefSchema>;

export const contentVersionSchema = z.object({
  id: z.string().uuid(),
  kind: z.string().min(1),
  version: z.number().int().min(0),
  updated_at: z.string(),
});
export type ContentVersion = z.infer<typeof contentVersionSchema>;

export const diceRollSchema = z.object({
  id: z.string().uuid(),
  roller: z.string().uuid().nullable(),
  kind: z.string(),
  die: z.number().int(),
  extra_die: z.number().int().nullable(),
  modifier: z.number().int(),
  total: z.number().int(),
  critical: z.boolean(),
  fumble: z.boolean(),
  detail: z.record(z.unknown()).nullable(),
  created_at: z.string(),
});
export type DiceRoll = z.infer<typeof diceRollSchema>;

// ---- Phase 1 content entities (validated at the read boundary) ----

export const skillSchema = z.object({
  id: z.string().uuid(),
  owner: z.string().uuid(),
  skill_def_id: z.string().uuid(),
  spec: z.string().nullable(),
  level: z.number().int().min(0).max(10),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Skill = z.infer<typeof skillSchema>;

export const cyberwareSchema = z.object({
  id: z.string().uuid(),
  owner: z.string().uuid(),
  name: z.string().min(1),
  slot: z.string(),
  detail: z.string().nullable(),
  sort: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Cyberware = z.infer<typeof cyberwareSchema>;

export const inventoryCategorySchema = z.enum([
  "weapon",
  "armor",
  "utility",
  "implant",
  "junk",
]);
export type InventoryCategory = z.infer<typeof inventoryCategorySchema>;

export const inventoryItemSchema = z.object({
  id: z.string().uuid(),
  owner: z.string().uuid(),
  name: z.string().min(1),
  category: inventoryCategorySchema,
  subtitle: z.string().nullable(),
  qty: z.number().int().min(0),
  equipped: z.boolean(),
  detail: z.string().nullable(),
  damage: z.string().nullable(),
  rof: z.number().int().nullable(),
  mag: z.string().nullable(),
  sort: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export const contactSchema = z.object({
  id: z.string().uuid(),
  owner: z.string().uuid(),
  name: z.string().min(1),
  relationship: z.string(),
  online: z.boolean(),
  sort: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Contact = z.infer<typeof contactSchema>;

export const missionSchema = z.object({
  id: z.string().uuid(),
  owner: z.string().uuid(),
  title: z.string().min(1),
  status: z.enum(["current", "done", "failed"]),
  sort: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Mission = z.infer<typeof missionSchema>;

export const freeTimeLedgerSchema = z.object({
  id: z.string().uuid(),
  owner: z.string().uuid(),
  hours_remaining: z.number().int().min(0),
  hours_total: z.number().int().min(1),
  created_at: z.string(),
  updated_at: z.string(),
});
export type FreeTimeLedger = z.infer<typeof freeTimeLedgerSchema>;

export const characterBackgroundSchema = z.object({
  id: z.string().uuid(),
  owner: z.string().uuid(),
  slot: z.string().min(1),
  label: z.string().min(1),
  body: z.string(),
  sort: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type CharacterBackground = z.infer<typeof characterBackgroundSchema>;

export const activitySchema = z.object({
  id: z.string().uuid(),
  owner: z.string().uuid().nullable(),
  kind: z.enum(["standard", "random"]),
  name: z.string().min(1),
  hour_cost: z.number().int().min(0).nullable(),
  icon: z.string().nullable(),
  with_contact: z.string().nullable(),
  reward: z.string().nullable(),
  skill_check: z.string().nullable(),
  deadline_label: z.string().nullable(),
  planned_label: z.string().nullable(),
  progress: z.number().int().min(0),
  progress_max: z.number().int().min(0),
  sort: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Activity = z.infer<typeof activitySchema>;

export const newsPostSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  body: z.string().min(1),
  kind: z.string(),
  sort: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type NewsPost = z.infer<typeof newsPostSchema>;

export const timelineEventSchema = z.object({
  id: z.string().uuid(),
  session_no: z.number().int(),
  title: z.string().min(1),
  date_label: z.string().min(1),
  summary: z.string(),
  full_text: z.string(),
  sort: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type TimelineEvent = z.infer<typeof timelineEventSchema>;

export const catalogCategorySchema = z.enum(["weapon", "armor", "utility", "implant"]);
export type CatalogCategory = z.infer<typeof catalogCategorySchema>;

export const catalogItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  category: catalogCategorySchema,
  subtitle: z.string().nullable(),
  price: z.number().int().min(0),
  sort: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type CatalogItem = z.infer<typeof catalogItemSchema>;

export const storeSettingsSchema = z.object({
  id: z.string().uuid(),
  singleton: z.boolean(),
  is_open: z.boolean(),
  closes_at: z.string().nullable(),
  note: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type StoreSettings = z.infer<typeof storeSettingsSchema>;

/** Server `roll` Edge Function response shape (validated client-side). */
export const rollResponseSchema = z.object({
  die: z.number().int().min(1).max(10),
  extraDie: z.number().int().min(1).max(10).nullable(),
  total: z.number().int(),
  critical: z.boolean(),
  fumble: z.boolean(),
  rollId: z.string().uuid(),
});
export type RollResponse = z.infer<typeof rollResponseSchema>;
