// NETRUN OS — Activities tab. Free-Time card + segmented meter, a Standard activities
// list (unaffordable ones greyed), and a Random activities board (NPC-named, with reward,
// deadline, skill-check DV, progress). Display-only this phase (running them is later).

import { Panel, Card, SectionHeader, Segmented, Icon, type IconKey } from "@/app/ui";
import type { Activity } from "@/schemas";
import { useActivities, useFreeTime } from "../data";
import { ScreenFrame } from "./common";

const ICON_KEYS: ReadonlySet<string> = new Set([
  "cart", "star", "clock", "user", "message", "medkit", "chip",
]);
const iconOf = (s: string | null): IconKey =>
  s && ICON_KEYS.has(s) ? (s as IconKey) : "star";

export function ActivitiesScreen() {
  const { data, isLoading, error } = useActivities();
  const { ledger } = useFreeTime();

  const standard = (data ?? []).filter((a) => a.kind === "standard").sort((a, b) => a.sort - b.sort);
  const random = (data ?? []).filter((a) => a.kind === "random").sort((a, b) => a.sort - b.sort);
  const remaining = ledger?.hours_remaining ?? 0;
  const total = ledger?.hours_total ?? 24;
  const filled = total > 0 ? Math.round((remaining / total) * 10) : 0;

  return (
    <ScreenFrame kicker="Free-Time Economy" title="ACTIVITIES" loading={isLoading} error={error?.message}>
      {/* Free time remaining */}
      <Panel accent style={{ left: 130, top: 130, width: 440, height: 200, padding: "20px 24px" }}>
        <div style={{ font: "300 12px Inter", letterSpacing: 3, color: "var(--dim)", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="clock" size={15} />
          FREE TIME REMAINING
        </div>
        <div className="gw" style={{ fontFamily: "Corpta", fontSize: 72, lineHeight: 0.9, marginTop: 4 }}>
          {remaining}
          <span style={{ fontSize: 22, color: "var(--p1)", marginLeft: 8 }}>HRS</span>
        </div>
        <div style={{ marginTop: 14 }}>
          <Segmented filled={filled} total={10} height={11} />
        </div>
      </Panel>

      {/* Standard activities */}
      <div style={{ position: "absolute", left: 130, top: 352, width: 440 }}>
        <SectionHeader title="STANDARD" meta="ALWAYS OPEN" />
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 11, maxHeight: 380, overflowY: "auto", paddingRight: 4 }}>
          {standard.map((a) => {
            const unaffordable = a.hour_cost !== null && a.hour_cost > remaining;
            return (
              <Card
                key={a.id}
                accent
                tap={!unaffordable}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  padding: "12px 15px",
                  opacity: unaffordable ? 0.42 : 1,
                  filter: unaffordable ? "grayscale(.3)" : undefined,
                }}
              >
                <div className="iconbox" style={{ width: 38, height: 38, flex: "none" }}>
                  <Icon name={iconOf(a.icon)} size={20} />
                </div>
                <div style={{ flex: 1, fontFamily: "Corpta", fontSize: 16 }}>{a.name}</div>
                {a.hour_cost !== null && (
                  <div style={{ fontFamily: "Corpta", fontSize: 19, color: "var(--p2)" }}>
                    {a.hour_cost}
                    <span style={{ font: "400 11px Inter", color: "var(--dim)" }}>H</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Random activities board */}
      <div style={{ position: "absolute", left: 610, top: 130, width: 950 }}>
        <SectionHeader title="RANDOM ACTIVITIES" meta={`${random.length} AVAILABLE`} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16, maxHeight: 600, overflowY: "auto", paddingRight: 4 }}>
          {random.map((a) => (
            <RandomCard key={a.id} a={a} />
          ))}
        </div>
      </div>
    </ScreenFrame>
  );
}

function RandomCard({ a }: { a: Activity }) {
  return (
    <Card accent tap style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontFamily: "Corpta", fontSize: 19 }}>{a.name}</span>
        {a.deadline_label && (
          <span style={{ display: "flex", alignItems: "center", gap: 5, font: "700 11px Inter", color: "var(--news)" }}>
            <Icon name="clock" size={13} />
            {a.deadline_label}
          </span>
        )}
      </div>
      {a.with_contact && (
        <div style={{ font: "300 12px Inter", color: "var(--dim)", marginTop: 3 }}>With · {a.with_contact}</div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
        {a.reward && <span style={{ fontFamily: "Corpta", fontSize: 14, color: "var(--p2)" }}>{a.reward}</span>}
        {a.skill_check && <span style={{ font: "300 12px Inter", color: "var(--p1)" }}>{a.skill_check}</span>}
      </div>
      {a.progress_max > 0 && (
        <div style={{ marginTop: 12 }}>
          <Segmented filled={a.progress} total={a.progress_max} />
        </div>
      )}
      {a.planned_label && (
        <div style={{ font: "700 10px Inter", color: "var(--p1)", marginTop: 6 }}>{a.planned_label}</div>
      )}
      <button
        type="button"
        className="btn"
        style={{ marginTop: 13, padding: "9px 0", width: "100%" }}
        title="Running activities arrives in a later phase"
      >
        {a.planned_label ? "JOIN ▸" : "ATTEMPT ▸"}
      </button>
    </Card>
  );
}
