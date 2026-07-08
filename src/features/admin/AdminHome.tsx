// NETRUN OS — GM Admin / Master Control home shell (Phase 0: chrome + dev panels).
// Full authoring (NPC manager, Quest maker, Session arena controls) arrives later.

import { NavShell, icons, type NavItem } from "@/app/NavShell";
import { useSession } from "@/lib/session";
import { RealtimeSmoke } from "@/features/dev/RealtimeSmoke";
import { DebugPanel } from "@/features/dev/DebugPanel";

const NAV: NavItem[] = [
  { key: "home", label: "Control", icon: icons.admin, active: true },
  { key: "players", label: "Players", icon: icons.character },
  { key: "npcs", label: "NPCs", icon: icons.contacts },
  { key: "quests", label: "Quests", icon: icons.quests },
  { key: "session", label: "Session", icon: icons.session },
  { key: "store", label: "Store", icon: icons.store },
];

export function AdminHome() {
  const profile = useSession((s) => s.profile);
  const signOut = useSession((s) => s.signOut);

  return (
    <NavShell brand="GM" items={NAV}>
      <div className="page">
        <div className="ttl" style={{ position: "relative", marginBottom: 22 }}>
          <div className="k">GM Admin · Master Control</div>
          <div className="t">Control</div>
        </div>

        <div style={{ fontSize: 13, color: "var(--dim)", marginBottom: 20 }}>
          Signed in as{" "}
          <b style={{ color: "var(--ink)" }}>{profile?.display_name ?? "…"}</b> ·
          role <span style={{ color: "var(--p1)" }}>{profile?.role}</span>
          <button
            type="button"
            className="btn ghost"
            onClick={() => void signOut()}
            style={{ padding: "6px 14px", marginLeft: 16, fontSize: 12 }}
          >
            Sign Out
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 18,
            maxWidth: 900,
          }}
        >
          <DebugPanel />
          <RealtimeSmoke />
        </div>
      </div>

      <div className="foot">NETRUN OS · GM · PHASE 0</div>
    </NavShell>
  );
}
