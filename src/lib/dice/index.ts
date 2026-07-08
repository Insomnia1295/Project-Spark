// NETRUN OS — Cyberpunk RED dice resolution (pure, deterministic given an Rng).
//
// LOCKED RULES (plan §4.3, §13.5):
//   Resolution = 1d10 + STAT + SKILL + mods vs DV.
//   Natural 10 -> roll ONE more d10 and ADD it (explodes ONCE, no chaining).
//   Natural 1  -> roll ONE more d10 and SUBTRACT it (once).
//   RAW crits: the exploding die does NOT chain (a second 10 does not explode again).
//   No house-rule toggle.
//
// This module is used for UI previews and unit tests with a *seeded* Rng.
// Consequential rolls must go through the server Edge Function `roll`.

import { createRng, type Rng } from "./prng";

export type { Rng } from "./prng";
export { createRng } from "./prng";

export interface D10Result {
  /** The first natural d10 (1..10). */
  die: number;
  /** The extra d10 from a nat-10 (added) or nat-1 (subtracted); null otherwise. */
  extraDie: number | null;
  /** die +/- extraDie (no stat/skill/mods). */
  raw: number;
  critical: boolean; // natural 10
  fumble: boolean; // natural 1
}

export interface SkillCheckInput {
  stat: number;
  skill: number;
  dv?: number | undefined;
  mods?: number | undefined;
}

export interface SkillCheckResult extends D10Result {
  stat: number;
  skill: number;
  mods: number;
  /** raw + stat + skill + mods. */
  total: number;
  dv: number | null;
  /** total >= dv, or null when no DV supplied. */
  success: boolean | null;
}

function d10(rng: Rng): number {
  return rng.nextInt(10) + 1; // 1..10
}

function d6(rng: Rng): number {
  return rng.nextInt(6) + 1; // 1..6
}

/** A single CP RED d10 with the exploding/imploding rule applied (once). */
export function rollD10(rng: Rng): D10Result {
  const die = d10(rng);
  let extraDie: number | null = null;
  let raw = die;
  let critical = false;
  let fumble = false;

  if (die === 10) {
    critical = true;
    extraDie = d10(rng); // added once; does NOT chain even if this is also a 10
    raw = die + extraDie;
  } else if (die === 1) {
    fumble = true;
    extraDie = d10(rng); // subtracted once
    raw = die - extraDie;
  }

  return { die, extraDie, raw, critical, fumble };
}

/** Full skill check: 1d10 (RAW crit rules) + stat + skill + mods, optionally vs DV. */
export function skillCheck(rng: Rng, input: SkillCheckInput): SkillCheckResult {
  const { stat, skill } = input;
  const mods = input.mods ?? 0;
  const dv = input.dv ?? null;

  const d = rollD10(rng);
  const total = d.raw + stat + skill + mods;
  const success = dv === null ? null : total >= dv;

  return {
    ...d,
    stat,
    skill,
    mods,
    total,
    dv,
    success,
  };
}

/** Sum of N six-sided dice (weapon damage, Xd6). */
export function rollNd6(rng: Rng, n: number): { dice: number[]; total: number } {
  if (n < 0 || !Number.isInteger(n)) throw new Error("n must be a non-negative integer");
  const dice: number[] = [];
  let total = 0;
  for (let i = 0; i < n; i++) {
    const v = d6(rng);
    dice.push(v);
    total += v;
  }
  return { dice, total };
}

/** 2d6 — used by the RED critical-injury tables. */
export function roll2d6(rng: Rng): { dice: [number, number]; total: number } {
  const a = d6(rng);
  const b = d6(rng);
  return { dice: [a, b], total: a + b };
}

/** Convenience: a fresh seeded skill check (e.g. UI preview from a seed). */
export function seededSkillCheck(
  seed: number | bigint,
  input: SkillCheckInput,
): SkillCheckResult {
  return skillCheck(createRng(seed), input);
}
