// NETRUN OS — Home tab. Centered hero, nameplate + vitals, current mission, City News.
// All values from the cloud (character_sheet, mission, news_post). No hardcoded content.

import { useState } from "react";
import { Panel } from "@/app/ui";
import { asset } from "@/app/assets";
import { useCharacter, useCurrentMission, useNews } from "../data";
import { StatusNote } from "./common";

/** Two-line nameplate (FIRST / LAST) derived from the character's full name. */
function nameLines(name: string): [string, string] {
  const tokens = name.replace(/["“”]/g, "").split(/\s+/).filter(Boolean);
  const first = tokens[0] ?? name;
  const last = tokens.length > 1 ? tokens[tokens.length - 1] ?? "" : "";
  return [first.toUpperCase(), last.toUpperCase()];
}

export function HomeScreen() {
  const { character, isLoading, error } = useCharacter();
  const { mission } = useCurrentMission();
  const { data: news } = useNews();
  const [newsOpen, setNewsOpen] = useState(false);

  if (error) return <StatusNote tone="error">{error.message}</StatusNote>;
  if (isLoading || !character) return <StatusNote>LOADING…</StatusNote>;

  const [first, last] = nameLines(character.name);
  const hero = asset("hero.steven");
  const bulletin = news?.slice().sort((a, b) => a.sort - b.sort)[0] ?? null;
  const humanityFrac = character.humanity / (character.stat_emp * 10);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* pedestal glow */}
      <div
        style={{
          position: "absolute",
          left: "52%",
          transform: "translateX(-50%)",
          bottom: 8,
          width: 440,
          height: 96,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, var(--p1), transparent 68%)",
          opacity: 0.24,
          filter: "blur(6px)",
          zIndex: 2,
        }}
      />
      {/* hero (temp placeholder art via registry) */}
      <div
        style={{
          position: "absolute",
          left: "52%",
          transform: "translateX(-50%)",
          bottom: 0,
          width: 460,
          height: 600,
          zIndex: 3,
          background: hero.src ? `url(${hero.src}) center/cover` : hero.placeholder,
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
          maskImage: "linear-gradient(180deg, black 72%, transparent)",
          WebkitMaskImage: "linear-gradient(180deg, black 72%, transparent)",
          opacity: 0.9,
        }}
        aria-label="Character hero (placeholder)"
      />

      {/* nameplate + vitals (top-right) */}
      <div
        style={{
          position: "absolute",
          right: 56,
          top: 172,
          textAlign: "right",
          zIndex: 4,
          textShadow: "0 3px 20px rgba(0,0,0,.7)",
        }}
      >
        {character.role_line && (
          <div style={{ fontFamily: "Corpta", fontSize: 15, letterSpacing: 4, color: "var(--p1)" }}>
            {character.role_line}
          </div>
        )}
        <div
          className="gw"
          style={{ fontFamily: "Corpta", fontSize: 74, lineHeight: 0.9, color: "var(--pure)", marginTop: 6 }}
        >
          {first}
          {last && (
            <>
              <br />
              {last}
            </>
          )}
        </div>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            alignItems: "flex-end",
          }}
        >
          <Vital label="HP" right={`${character.hp} / ${character.max_hp}`} frac={character.hp / character.max_hp} hp />
          <Vital label="HUMANITY" right={String(character.humanity)} frac={humanityFrac} />
        </div>
      </div>

      {/* current mission (bottom-left) */}
      <Panel accent style={{ left: 130, bottom: 52, width: 410, padding: "18px 24px", zIndex: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "var(--p1)",
              boxShadow: "0 0 10px var(--p1)",
            }}
          />
          <span style={{ font: "300 12px Inter", letterSpacing: 2, color: "var(--dim)" }}>
            CURRENT MISSION
          </span>
        </div>
        <div className="gw" style={{ fontFamily: "Corpta", fontSize: 24, lineHeight: 1.15 }}>
          {mission ? mission.title : "No active mission"}
        </div>
      </Panel>

      {/* city news (bottom-right, expandable) */}
      {bulletin && (
        <Panel
          style={{
            right: 56,
            bottom: 52,
            width: 468,
            padding: "16px 22px",
            zIndex: 6,
            borderColor: "var(--news)",
          }}
        >
          <button
            type="button"
            onClick={() => setNewsOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              marginBottom: 8,
              textAlign: "left",
            }}
          >
            <span style={{ fontFamily: "Corpta", fontSize: 16, letterSpacing: 2 }}>
              {bulletin.title.toUpperCase()}
            </span>
            <span style={{ marginLeft: "auto", color: "var(--news)", fontSize: 12 }}>
              {newsOpen ? "▾" : "▸"}
            </span>
          </button>
          <div
            style={{
              font: "300 13px Inter",
              color: "var(--dim)",
              lineHeight: 1.5,
              paddingTop: 8,
              borderTop: "1px solid rgba(255,255,255,.1)",
              maxHeight: newsOpen ? 320 : 78,
              overflow: "hidden",
              transition: "max-height .3s var(--ease-hud)",
            }}
          >
            {bulletin.body}
          </div>
        </Panel>
      )}
    </div>
  );
}

function Vital({
  label,
  right,
  frac,
  hp,
}: {
  label: string;
  right: string;
  frac: number;
  hp?: boolean;
}) {
  const pct = Math.max(0, Math.min(1, frac)) * 100;
  return (
    <div style={{ width: 300 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          font: "300 11px Inter",
          color: "var(--dim)",
          marginBottom: 5,
        }}
      >
        <span>{label}</span>
        <span>{right}</span>
      </div>
      <div style={{ height: 9, borderRadius: 9, background: "var(--track)", overflow: "hidden" }}>
        <i
          style={{
            display: "block",
            height: "100%",
            width: `${pct}%`,
            background: hp ? "var(--grad-hp)" : "var(--grad-humanity)",
          }}
        />
      </div>
    </div>
  );
}
