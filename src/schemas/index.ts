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
