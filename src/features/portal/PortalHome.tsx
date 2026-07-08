// NETRUN OS — Player Portal home shell (Phase 0: chrome + dev panels only).
// Real tabs (Home/Character/Contacts/Quests/Session/Store) arrive in Phase 1+.

import { NavShell, icons, type NavItem } from "@/app/NavShell";
import { useSession } from "@/lib/session";
import { RealtimeSmoke } from "@/features/dev/RealtimeSmoke";
import { DebugPanel } from "@/features/dev/DebugPanel";

const NAV: NavItem[] = [
  { key: "home", label: "Home", icon: icons.home, active: true },
  { key: "character", label: "Character", icon: icons.character },
  { key: "contacts", label: "Contacts", icon: icons.contacts },
  { key: "quests", label: "Quests", icon: icons.quests },
  { key: "session", label: "Session", icon: icons.session },
  { key: "store", label: "Store", icon: icons.store },
];

export function PortalHome() {
  const profile = useSession((s) => s.profile);
  const signOut = useSession((s) => s.signOut);

  return (
    <NavShell brand="NR" items={NAV}>
      <div className="page">
        <div className="ttl" style={{ position: "relative", marginBottom: 22 }}>
          <div className="k">Player Portal</div>
          <div className="t">Home</div>
        </div>

        <div style={{ fontSize: 13, color: "var(--dim)", marginBottom: 20 }}>
          Signed in as{" "}
          <b style={{ color: "var(--ink)" }}>{profile?.display_name ?? "…"}</b> ·
          role <span style={{ color: "var(--p2)" }}>{profile?.role}</span>
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

      <div className="foot">NETRUN OS · PHASE 0 · IN-WORLD 3 JUL 2076</div>
    </NavShell>
  );
}
