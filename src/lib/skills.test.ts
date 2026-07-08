// NETRUN OS — skill-total unit tests (Phase 1 self-test #2).
// Validates displayed skill value = level + governing stat against Steven's sheet.

import { describe, expect, it } from "vitest";
import type { CharacterSheet } from "@/schemas";
import { deathSaveDv, seriouslyWounded, skillTotal, statValue } from "./skills";

// Steven "Doc" Heartman — reconciled to Docs/reference/Steven Heartman.pdf.
const STEVEN: CharacterSheet = {
  id: "00000000-0000-0000-0000-000000000000",
  owner: "00000000-0000-0000-0000-000000000001",
  name: 'Steven "Doc" Heartman',
  stat_int: 8,
  stat_ref: 6,
  stat_dex: 4,
  stat_tech: 8,
  stat_cool: 7,
  stat_will: 5,
  stat_luck: 7,
  stat_move: 3,
  stat_body: 8,
  stat_emp: 7,
  hp: 45,
  max_hp: 45,
  humanity: 42,
  reputation: 0,
  handle: "Doc / Vargo Quinn",
  role_title: "Medtech",
  role_line: "MEDTECH · RIPPER-DOC MERC",
  role_ability: "Medicine",
  role_rank: 4,
  eddies: 4157,
  created_at: "2076-07-03T00:00:00Z",
  updated_at: "2076-07-03T00:00:00Z",
};

describe("skillTotal", () => {
  // The four cases the plan (§4.2) and Phase 1 spec (§8.2) call out explicitly.
  it("Education 6 + INT 8 = 14", () => {
    expect(skillTotal(STEVEN, "INT", 6)).toBe(14);
  });
  it("Conversation 6 + EMP 7 = 13", () => {
    expect(skillTotal(STEVEN, "EMP", 6)).toBe(13);
  });
  it("Persuasion 5 + COOL 7 = 12", () => {
    expect(skillTotal(STEVEN, "COOL", 5)).toBe(12);
  });
  it("Concentration 2 + WILL 5 = 7", () => {
    expect(skillTotal(STEVEN, "WILL", 2)).toBe(7);
  });

  // A few more from the sheet, incl. the DEX fighting-skill fix (Brawling is DEX).
  it("Handgun 8 + REF 6 = 14", () => {
    expect(skillTotal(STEVEN, "REF", 8)).toBe(14);
  });
  it("Paramedic 6 + TECH 8 = 14", () => {
    expect(skillTotal(STEVEN, "TECH", 6)).toBe(14);
  });
  it("Brawling 2 + DEX 4 = 6 (DEX, not REF)", () => {
    expect(skillTotal(STEVEN, "DEX", 2)).toBe(6);
  });

  it("a level/stat change recomputes the total", () => {
    const leveled: CharacterSheet = { ...STEVEN, stat_int: 9 };
    expect(skillTotal(leveled, "INT", 6)).toBe(15);
  });
});

describe("derived vitals", () => {
  it("statValue reads the right column", () => {
    expect(statValue(STEVEN, "BODY")).toBe(8);
  });
  it("Death Save DV = BODY", () => {
    expect(deathSaveDv(STEVEN)).toBe(8);
  });
  it("Seriously Wounded = floor(max HP / 2)", () => {
    expect(seriouslyWounded(STEVEN)).toBe(22);
  });
});
