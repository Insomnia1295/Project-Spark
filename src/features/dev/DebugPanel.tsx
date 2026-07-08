// NETRUN OS — Phase 0 debug panel. Minimal proof that data flows: shows the signed-in
// character sheet from the cloud, a *local seeded* dice preview, and a *server-authoritative*
// roll via the `roll` Edge Function. Feature screens replace this in Phase 1.

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session";
import {
  characterSheetSchema,
  rollResponseSchema,
  type CharacterSheet,
  type RollResponse,
} from "@/schemas";
import { seededSkillCheck } from "@/lib/dice";

const STAT_KEYS: Array<[keyof CharacterSheet, string]> = [
  ["stat_int", "INT"],
  ["stat_ref", "REF"],
  ["stat_dex", "DEX"],
  ["stat_tech", "TECH"],
  ["stat_cool", "COOL"],
  ["stat_will", "WILL"],
  ["stat_luck", "LUCK"],
  ["stat_move", "MOVE"],
  ["stat_body", "BODY"],
  ["stat_emp", "EMP"],
];

export function DebugPanel() {
  const profile = useSession((s) => s.profile);
  const [sheet, setSheet] = useState<CharacterSheet | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [serverRoll, setServerRoll] = useState<RollResponse | null>(null);
  const [rollError, setRollError] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // GM sees the first sheet; a player sees their own (RLS enforces this too).
      const query = supabase.from("character_sheet").select("*").limit(1);
      const { data, error } = await query;
      if (cancelled) return;
      if (error) {
        setSheetError(error.message);
        return;
      }
      const row = data?.[0];
      if (!row) {
        setSheetError("No character sheet visible (check RLS / seed).");
        return;
      }
      const parsed = characterSheetSchema.safeParse(row);
      if (!parsed.success) {
        setSheetError("Sheet failed Zod validation.");
        return;
      }
      setSheet(parsed.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  // Local seeded preview — reproducible, NOT authoritative.
  const preview = seededSkillCheck(Date.now() % 100000, {
    stat: sheet?.stat_int ?? 8,
    skill: 6,
    dv: 15,
  });

  async function doServerRoll() {
    setRolling(true);
    setRollError(null);
    const { data, error } = await supabase.functions.invoke("roll", {
      body: { stat: sheet?.stat_int ?? 8, skill: 6, mods: 0, kind: "debug" },
    });
    setRolling(false);
    if (error) {
      setRollError(error.message);
      return;
    }
    const parsed = rollResponseSchema.safeParse(data);
    if (!parsed.success) {
      setRollError("Server response failed validation.");
      return;
    }
    setServerRoll(parsed.data);
  }

  return (
    <div className="cd" style={{ padding: 18 }}>
      <div className="hh" style={{ marginBottom: 12 }}>
        <span>DEBUG · SEEDED DATA</span>
      </div>

      {sheetError && (
        <div style={{ color: "var(--p1)", fontSize: 12 }}>{sheetError}</div>
      )}

      {sheet && (
        <>
          <div style={{ fontFamily: "Corpta", fontSize: 20, letterSpacing: 1 }}>
            {sheet.name.toUpperCase()}
          </div>
          <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 12 }}>
            HP {sheet.hp}/{sheet.max_hp} · Humanity {sheet.humanity}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 8,
              marginBottom: 14,
            }}
          >
            {STAT_KEYS.map(([k, lbl]) => (
              <div
                key={lbl}
                style={{
                  textAlign: "center",
                  border: "1px solid var(--str)",
                  padding: "6px 0",
                }}
              >
                <div style={{ fontSize: 9, letterSpacing: 1, color: "var(--faint)" }}>
                  {lbl}
                </div>
                <div style={{ fontFamily: "Corpta", fontSize: 18 }}>
                  {String(sheet[k])}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 10 }}>
        Local seeded preview (Education 6 + INT): die {preview.die}
        {preview.extraDie !== null ? ` (+extra ${preview.extraDie})` : ""} → total{" "}
        <b style={{ color: "var(--ink)" }}>{preview.total}</b>{" "}
        {preview.success !== null && (preview.success ? "✓ vs DV15" : "✗ vs DV15")}
      </div>

      <button
        type="button"
        className="btn ghost"
        onClick={doServerRoll}
        disabled={rolling}
        style={{ padding: "9px 16px" }}
      >
        {rolling ? "Rolling…" : "Server Roll (Edge Fn)"}
      </button>

      {rollError && (
        <div style={{ color: "var(--p1)", fontSize: 12, marginTop: 8 }}>
          {rollError}
        </div>
      )}
      {serverRoll && (
        <div style={{ fontSize: 12, color: "var(--ok)", marginTop: 8 }}>
          Server: die {serverRoll.die}
          {serverRoll.extraDie !== null ? ` +${serverRoll.extraDie}` : ""} → total{" "}
          {serverRoll.total} {serverRoll.critical ? "· CRIT" : ""}
          {serverRoll.fumble ? "· FUMBLE" : ""} (id {serverRoll.rollId.slice(0, 8)})
        </div>
      )}
    </div>
  );
}
