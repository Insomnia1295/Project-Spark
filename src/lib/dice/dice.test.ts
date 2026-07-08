import { describe, it, expect } from "vitest";
import { createRng } from "./prng";
import {
  rollD10,
  skillCheck,
  rollNd6,
  roll2d6,
  seededSkillCheck,
} from "./index";

describe("PRNG (xoshiro256**)", () => {
  it("is reproducible from the same seed", () => {
    const a = createRng(12345);
    const b = createRng(12345);
    const seqA = Array.from({ length: 20 }, () => a.nextInt(10));
    const seqB = Array.from({ length: 20 }, () => b.nextInt(10));
    expect(seqA).toEqual(seqB);
  });

  it("differs across seeds", () => {
    const a = createRng(1);
    const b = createRng(2);
    const seqA = Array.from({ length: 20 }, () => a.nextInt(1000));
    const seqB = Array.from({ length: 20 }, () => b.nextInt(1000));
    expect(seqA).not.toEqual(seqB);
  });

  it("nextInt stays in [0, max)", () => {
    const r = createRng(99);
    for (let i = 0; i < 10000; i++) {
      const v = r.nextInt(10);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
    }
  });
});

describe("d10 distribution (self-test 4a)", () => {
  it("each face is ~10% over 100k rolls", () => {
    const r = createRng(0xdeadbeef);
    const counts = new Array<number>(11).fill(0);
    const N = 100_000;
    for (let i = 0; i < N; i++) {
      // raw face 1..10 — re-derive from nextInt to avoid the explode logic here
      const face = r.nextInt(10) + 1;
      counts[face] = (counts[face] ?? 0) + 1;
    }
    for (let face = 1; face <= 10; face++) {
      const pct = (counts[face] ?? 0) / N;
      // 10% +/- 1% is comfortably within noise for 100k samples
      expect(pct).toBeGreaterThan(0.09);
      expect(pct).toBeLessThan(0.11);
    }
  });
});

describe("CP RED crit/fumble rules (self-test 4b) — RAW, no chaining", () => {
  it("natural 10 adds exactly one extra die and does NOT chain", () => {
    // Find a seed whose first die is 10, then assert exactly one extra die.
    let found = false;
    for (let seed = 1; seed < 500 && !found; seed++) {
      const r = createRng(seed);
      const res = rollD10(r);
      if (res.die === 10) {
        found = true;
        expect(res.critical).toBe(true);
        expect(res.fumble).toBe(false);
        expect(res.extraDie).not.toBeNull();
        expect(res.extraDie).toBeGreaterThanOrEqual(1);
        expect(res.extraDie).toBeLessThanOrEqual(10);
        // raw = die + exactly one extra die (proves no chaining)
        expect(res.raw).toBe(10 + (res.extraDie ?? 0));
      }
    }
    expect(found).toBe(true);
  });

  it("natural 1 subtracts exactly one extra die", () => {
    let found = false;
    for (let seed = 1; seed < 500 && !found; seed++) {
      const r = createRng(seed);
      const res = rollD10(r);
      if (res.die === 1) {
        found = true;
        expect(res.fumble).toBe(true);
        expect(res.critical).toBe(false);
        expect(res.extraDie).not.toBeNull();
        expect(res.raw).toBe(1 - (res.extraDie ?? 0));
      }
    }
    expect(found).toBe(true);
  });

  it("a middle roll (2..9) has no extra die", () => {
    let found = false;
    for (let seed = 1; seed < 200 && !found; seed++) {
      const res = rollD10(createRng(seed));
      if (res.die >= 2 && res.die <= 9) {
        found = true;
        expect(res.extraDie).toBeNull();
        expect(res.critical).toBe(false);
        expect(res.fumble).toBe(false);
        expect(res.raw).toBe(res.die);
      }
    }
    expect(found).toBe(true);
  });

  it("never explodes more than once across many crit samples", () => {
    // Statistically exercise many crits; raw can never exceed 10 + 10 = 20.
    const r = createRng(0xabcdef);
    for (let i = 0; i < 50_000; i++) {
      const res = rollD10(r);
      expect(res.raw).toBeLessThanOrEqual(20);
      expect(res.raw).toBeGreaterThanOrEqual(1 - 10);
      if (res.critical) expect(res.raw).toBeLessThanOrEqual(20);
    }
  });
});

describe("skillCheck totals (self-test 4d)", () => {
  it("Education skill 6 + INT 8 = +14 before the die", () => {
    // Force a known non-crit die by scanning seeds for die in 2..9.
    let checked = false;
    for (let seed = 1; seed < 200 && !checked; seed++) {
      const res = skillCheck(createRng(seed), { stat: 8, skill: 6 });
      if (res.die >= 2 && res.die <= 9) {
        checked = true;
        expect(res.stat + res.skill + res.mods).toBe(14);
        expect(res.total).toBe(res.die + 14);
      }
    }
    expect(checked).toBe(true);
  });

  it("applies DV success/fail correctly", () => {
    const res = seededSkillCheck(42, { stat: 7, skill: 5, dv: 15 });
    expect(res.total).toBe(res.raw + 12);
    expect(res.success).toBe(res.total >= 15);
  });

  it("mods are included", () => {
    const res = seededSkillCheck(7, { stat: 4, skill: 2, mods: -3 });
    expect(res.total).toBe(res.raw + 3);
  });
});

describe("Nd6 and 2d6", () => {
  it("rollNd6 sums N dice each in 1..6", () => {
    const r = createRng(555);
    const { dice, total } = rollNd6(r, 5);
    expect(dice).toHaveLength(5);
    for (const d of dice) {
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(6);
    }
    expect(total).toBe(dice.reduce((s, d) => s + d, 0));
  });

  it("rollNd6(0) is empty / 0", () => {
    const { dice, total } = rollNd6(createRng(1), 0);
    expect(dice).toHaveLength(0);
    expect(total).toBe(0);
  });

  it("roll2d6 in 2..12", () => {
    const r = createRng(9);
    for (let i = 0; i < 1000; i++) {
      const { total } = roll2d6(r);
      expect(total).toBeGreaterThanOrEqual(2);
      expect(total).toBeLessThanOrEqual(12);
    }
  });
});
