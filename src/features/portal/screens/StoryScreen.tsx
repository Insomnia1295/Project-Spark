// NETRUN OS — Story So Far tab. Lands on a horizontal ribbon (Sessions 01–0N); clicking
// an entry animates into a vertical detail view (full timeline left, featured write-up right).
// Ribbon and vertical are DOM siblings toggled via `hidden` (clean, no nesting bug).

import { useMemo, useState } from "react";
import { Panel, Card, Icon } from "@/app/ui";
import { asset } from "@/app/assets";
import type { TimelineEvent } from "@/schemas";
import { useTimeline } from "../data";
import { ScreenFrame } from "./common";

export function StoryScreen() {
  const { data, isLoading, error } = useTimeline();
  const [vertical, setVertical] = useState(false);
  const [selected, setSelected] = useState(0);

  const events = useMemo<TimelineEvent[]>(
    () => (data ?? []).slice().sort((a, b) => a.sort - b.sort || a.session_no - b.session_no),
    [data],
  );

  const open = (i: number) => {
    setSelected(i);
    setVertical(true);
  };

  return (
    <ScreenFrame kicker="Campaign Timeline" title="STORY SO FAR" loading={isLoading} error={error?.message}>
      {/* Ribbon */}
      <div className="story-view" hidden={vertical}>
        <div style={{ position: "absolute", left: 130, right: 44, top: 250 }}>
          <div style={{ position: "relative", height: 320 }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 58, height: 2, background: "var(--grad-timeline)" }} />
            {events.map((e, i) => (
              <div key={e.id} style={{ position: "absolute", left: 6 + i * 358, top: 0, width: 330 }}>
                <div style={{ position: "absolute", left: 2, top: 50, width: 18, height: 18, borderRadius: "50%", background: "var(--p1)", border: "3px solid var(--edge)", boxShadow: "0 0 12px var(--p1)" }} />
                <div style={{ position: "absolute", left: 0, top: 18, font: "700 10px Inter", color: "var(--p1)" }}>{e.date_label}</div>
                <Card accent tap onClick={() => open(i)} style={{ position: "absolute", left: 0, top: 96, width: 322, padding: "16px 18px" }}>
                  <div style={{ fontFamily: "Corpta", fontSize: 18 }}>{e.title}</div>
                  <div style={{ font: "300 10px Inter", color: "var(--faint)", letterSpacing: 2, margin: "3px 0 7px" }}>
                    SESSION {String(e.session_no).padStart(2, "0")}
                  </div>
                  <div style={{ font: "300 12px Inter", color: "var(--dim)", lineHeight: 1.45 }}>{e.summary}</div>
                  <div style={{ marginTop: 10, fontFamily: "Corpta", fontSize: 12, color: "var(--p1)" }}>OPEN ▸</div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vertical detail */}
      <div className="story-view" hidden={!vertical}>
        <button
          type="button"
          onClick={() => setVertical(false)}
          style={{ position: "absolute", left: 130, top: 150, display: "flex", alignItems: "center", gap: 8, fontFamily: "Corpta", fontSize: 14, letterSpacing: 1, color: "var(--p1)" }}
        >
          <Icon name="back" size={18} />
          BACK TO TIMELINE
        </button>

        {/* Timeline list */}
        <div style={{ position: "absolute", left: 130, top: 200, width: 604, height: 560, overflowY: "auto", paddingRight: 6 }}>
          <div style={{ position: "relative", paddingLeft: 30 }}>
            <div style={{ position: "absolute", left: 8, top: 6, bottom: 6, width: 2, background: "var(--grad-timeline)" }} />
            {events.map((e, i) => (
              <Card
                key={e.id}
                accent
                tap
                onClick={() => setSelected(i)}
                className={`vt-entry${i === selected ? " sel" : ""}`}
                style={{ padding: "13px 17px", marginBottom: 14 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontFamily: "Corpta", fontSize: 17 }}>{e.title}</span>
                  <span style={{ font: "700 10px Inter", color: "var(--p1)" }}>{e.date_label}</span>
                </div>
                <div style={{ font: "300 10px Inter", color: "var(--faint)", letterSpacing: 2, marginTop: 3 }}>
                  SESSION {String(e.session_no).padStart(2, "0")}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured */}
        {events[selected] && (
          <Panel accent style={{ left: 760, top: 200, width: 800, height: 560, padding: 0, overflow: "hidden" }}>
            <div style={{ height: 260, background: asset("comic.session").placeholder, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <span style={{ fontFamily: "Corpta", fontSize: 22, letterSpacing: 2, color: "rgba(255,255,255,.65)" }}>COMIC PANEL</span>
              <div style={{ position: "absolute", left: 18, bottom: 15, font: "700 10px Inter", color: "var(--pure)", letterSpacing: 1 }}>
                SESSION {String(events[selected].session_no).padStart(2, "0")}
              </div>
            </div>
            <div style={{ padding: "24px 28px", overflowY: "auto", maxHeight: 300 }}>
              <div className="gw" style={{ fontFamily: "Corpta", fontSize: 26 }}>{events[selected].title.toUpperCase()}</div>
              <div style={{ font: "300 10px Inter", color: "var(--p1)", letterSpacing: 2, marginTop: 4 }}>
                {events[selected].date_label} · FEATURED
              </div>
              <div style={{ font: "300 15px Inter", color: "var(--dim)", lineHeight: 1.6, marginTop: 14 }}>
                {events[selected].full_text}
              </div>
            </div>
          </Panel>
        )}
      </div>
    </ScreenFrame>
  );
}
