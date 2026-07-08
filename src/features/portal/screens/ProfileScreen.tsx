// NETRUN OS — Profile tab. Portrait + a 2×2 grid (Stats / Vitals / Top Skills / Chrome),
// plus the Background slide-out page. Stats & skills roll on click via the server function.
// Everything is data-driven (character_sheet, skill+skill_def, cyberware, character_background).

import { useMemo, useState } from "react";
import { Panel, SectionHeader, StatChip, VitalBar, SkillRow } from "@/app/ui";
import { asset } from "@/app/assets";
import { skillTotal, statValue, deathSaveDv } from "@/lib/skills";
import type { StatCode } from "@/schemas";
import { useCharacter, useSkills, useSkillDefs, useCyberware, useBackground } from "../data";
import { useRoll } from "../roll";
import { StatusNote } from "./common";

const STAT_ORDER: StatCode[] = [
  "INT", "REF", "DEX", "TECH", "COOL", "WILL", "LUCK", "MOVE", "BODY", "EMP",
];

interface ComputedSkill {
  id: string;
  label: string;
  level: number;
  govStat: StatCode;
  total: number;
}

export function ProfileScreen() {
  const { character, isLoading, error } = useCharacter();
  const { data: skills } = useSkills();
  const { data: defs } = useSkillDefs();
  const { data: chrome } = useCyberware();
  const { data: background } = useBackground();
  const { roll } = useRoll();
  const [slid, setSlid] = useState(false);
  const [fullList, setFullList] = useState(false);

  const computed = useMemo<ComputedSkill[]>(() => {
    if (!character || !skills || !defs) return [];
    const defMap = new Map(defs.map((d) => [d.id, d]));
    return skills.flatMap((s) => {
      const def = defMap.get(s.skill_def_id);
      if (!def) return [];
      const label = s.spec ? `${def.name} (${s.spec})` : def.name;
      return [
        {
          id: s.id,
          label,
          level: s.level,
          govStat: def.gov_stat,
          total: skillTotal(character, def.gov_stat, s.level),
        },
      ];
    });
  }, [character, skills, defs]);

  if (error) return <StatusNote tone="error">{error.message}</StatusNote>;
  if (isLoading || !character) return <StatusNote>LOADING…</StatusNote>;

  const portrait = asset("portrait.steven");
  const ranked = computed.slice().sort((a, b) => b.total - a.total || b.level - a.level);
  const shown = fullList ? ranked : ranked.slice(0, 6);

  const rollStat = (code: StatCode) =>
    roll(`${code} check`, { stat: statValue(character, code), skill: 0, kind: "stat" });
  const rollSkill = (s: ComputedSkill) =>
    roll(`${s.label} check`, {
      stat: statValue(character, s.govStat),
      skill: s.level,
      kind: "skill",
    });

  return (
    <div className={`slide-stage${slid ? " right" : ""}`}>
      {/* ---------------- Page 1: Profile ---------------- */}
      <div className="slide-page">
        <div className="ttl" style={{ position: "absolute", left: 130, top: 32 }}>
          <div className="k">Character Sheet</div>
          <div className="t gw">PROFILE</div>
        </div>

        {/* Portrait + nameplate */}
        <Panel style={{ left: 130, top: 130, width: 300, height: 620, padding: 14, overflow: "hidden" }}>
          <div
            style={{
              width: "100%",
              height: 430,
              overflow: "hidden",
              borderRadius: 8,
              background: portrait.src ? `url(${portrait.src}) center/cover` : portrait.placeholder,
            }}
          />
          <div style={{ padding: "14px 4px 0" }}>
            {character.role_line && (
              <div style={{ fontFamily: "Corpta", fontSize: 11, letterSpacing: 2, color: "var(--p1)" }}>
                {character.role_line}
              </div>
            )}
            <div className="gw" style={{ fontFamily: "Corpta", fontSize: 26, lineHeight: 0.95, marginTop: 5 }}>
              {character.name.replace(/["“”]/g, "").toUpperCase()}
            </div>
            {character.handle && (
              <div style={{ font: "300 12px Inter", color: "var(--dim)", marginTop: 8 }}>
                Handle · {character.handle}
              </div>
            )}
          </div>
        </Panel>

        {/* Stats (GM-locked; tap to roll d10 + stat) */}
        <Panel accent style={{ left: 462, top: 130, width: 536, height: 290, padding: "20px 24px" }}>
          <SectionHeader title="STATS" meta="TAP TO ROLL · GM-LOCKED" />
          <div
            style={{
              marginTop: 18,
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 9,
            }}
          >
            {STAT_ORDER.map((code) => (
              <StatChip key={code} label={code} value={statValue(character, code)} onRoll={() => rollStat(code)} />
            ))}
          </div>
        </Panel>

        {/* Vitals */}
        <Panel accent style={{ left: 1024, top: 130, width: 536, height: 290, padding: "20px 24px" }}>
          <SectionHeader title="VITALS" />
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 13 }}>
            <VitalBar label="HP" right={`${character.hp} / ${character.max_hp}`} fraction={character.hp / character.max_hp} variant="hp" />
            <VitalBar label="HUMANITY" right={String(character.humanity)} fraction={character.humanity / (character.stat_emp * 10)} variant="humanity" />
            <VitalBar
              label={`DEATH SAVE · BODY ${character.stat_body}`}
              right={`DV ${deathSaveDv(character)}`}
              fraction={character.hp > 0 ? 1 : 0}
            />
          </div>
        </Panel>

        {/* Top Skills (tap to roll d10 + level + governing stat) */}
        <Panel accent style={{ left: 462, top: 440, width: 536, height: 310, padding: "18px 24px", overflow: "hidden" }}>
          <SectionHeader
            title="TOP SKILLS"
            meta={
              <button type="button" onClick={() => setFullList((v) => !v)} style={{ color: "var(--p1)", font: "700 10px Inter", letterSpacing: 1 }}>
                {fullList ? "◂ TOP 6" : "FULL LIST ▸"}
              </button>
            }
          />
          <div style={{ marginTop: 16, maxHeight: 236, overflowY: fullList ? "auto" : "hidden", paddingRight: 4 }}>
            {shown.map((s) => (
              <SkillRow key={s.id} name={s.label} level={s.level} total={s.total} onRoll={() => rollSkill(s)} />
            ))}
          </div>
        </Panel>

        {/* Chrome (cyberware) */}
        <Panel accent style={{ left: 1024, top: 440, width: 536, height: 310, padding: "18px 24px", overflow: "hidden" }}>
          <SectionHeader title="CHROME" meta="INSTALLED" />
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10, maxHeight: 236, overflowY: "auto", paddingRight: 4 }}>
            {chrome?.slice().sort((a, b) => a.sort - b.sort).map((c) => (
              <div key={c.id} className="inset-row">
                <span style={{ font: "300 13px Inter" }}>{c.name}</span>
                {c.detail && (
                  <span style={{ fontFamily: "Corpta", fontSize: 13, color: "var(--p2)" }}>{c.detail}</span>
                )}
              </div>
            ))}
          </div>
        </Panel>

        {/* Slide control → Background */}
        <button
          type="button"
          className="btn"
          onClick={() => setSlid(true)}
          style={{ position: "absolute", right: 44, bottom: 40, padding: "12px 22px", zIndex: 7 }}
        >
          BACKGROUND ▸
        </button>
      </div>

      {/* ---------------- Page 2: Background (lifepath) ---------------- */}
      <div className="slide-page">
        <button
          type="button"
          onClick={() => setSlid(false)}
          style={{
            position: "absolute",
            left: 130,
            top: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "Corpta",
            fontSize: 14,
            letterSpacing: 1,
            color: "var(--p1)",
          }}
        >
          ◂ BACK TO PROFILE
        </button>
        <div className="ttl" style={{ position: "absolute", left: 130, top: 74 }}>
          <div className="k">Lifepath</div>
          <div className="t gw">BACKGROUND</div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 130,
            top: 168,
            right: 44,
            bottom: 40,
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            paddingRight: 6,
          }}
        >
          {background?.slice().sort((a, b) => a.sort - b.sort).map((b) => (
            <div key={b.id} className="cd acc" style={{ padding: "14px 18px" }}>
              <div style={{ fontFamily: "Corpta", fontSize: 13, letterSpacing: 1, color: "var(--p1)" }}>
                {b.label.toUpperCase()}
              </div>
              <div style={{ font: "300 13px Inter", color: "var(--dim)", lineHeight: 1.5, marginTop: 6 }}>
                {b.body}
              </div>
            </div>
          ))}
          {(!background || background.length === 0) && <StatusNote>No background on file.</StatusNote>}
        </div>
      </div>
    </div>
  );
}
