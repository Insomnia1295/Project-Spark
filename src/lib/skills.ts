// NETRUN OS — skill/stat totals (plan §4.2).
// Displayed skill value = level + governing stat. Pure + data-driven: the governing
// stat comes from skill_def (seeded map), the stat value from the character sheet.
// Recomputes automatically wherever it's called, so a live level/stat change repaints.

import type { CharacterSheet, StatCode } from "@/schemas";

/** Maps a RED stat code to its column on the character sheet. */
const STAT_COLUMN: Record<StatCode, keyof CharacterSheet> = {
  INT: "stat_int",
  REF: "stat_ref",
  DEX: "stat_dex",
  TECH: "stat_tech",
  COOL: "stat_cool",
  WILL: "stat_will",
  LUCK: "stat_luck",
  MOVE: "stat_move",
  BODY: "stat_body",
  EMP: "stat_emp",
};

/** The value of a governing stat on a given sheet. */
export function statValue(sheet: CharacterSheet, code: StatCode): number {
  return sheet[STAT_COLUMN[code]] as number;
}

/** Displayed skill total = level + governing stat. */
export function skillTotal(
  sheet: CharacterSheet,
  govStat: StatCode,
  level: number,
): number {
  return level + statValue(sheet, govStat);
}

/** Death Save DV = BODY (RED). */
export function deathSaveDv(sheet: CharacterSheet): number {
  return sheet.stat_body;
}

/** Seriously Wounded threshold = floor(max HP / 2) (RED). */
export function seriouslyWounded(sheet: CharacterSheet): number {
  return Math.floor(sheet.max_hp / 2);
}
