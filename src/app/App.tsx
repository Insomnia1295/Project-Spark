// NETRUN OS — root router + auth/role gate.
// One codebase, two role-gated surfaces: GM -> /admin, players -> /portal.

import { useEffect } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useSession } from "@/lib/session";
import { LoginScreen } from "@/features/auth/LoginScreen";
import { PortalHome } from "@/features/portal/PortalHome";
import { AdminHome } from "@/features/admin/AdminHome";
import { StageViewport } from "./StageViewport";

function Splash({ text, sub }: { text: string; sub?: string }) {
  return (
    <StageViewport>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Corpta",
          letterSpacing: 3,
          color: "var(--dim)",
          fontSize: 18,
          textAlign: "center",
          padding: 40,
        }}
      >
        <div>{text}</div>
        {sub && (
          <div style={{ fontFamily: "Inter", letterSpacing: 0, fontSize: 13, color: "var(--faint)", maxWidth: 520 }}>
            {sub}
          </div>
        )}
      </div>
    </StageViewport>
  );
}

/** Shown when the profile couldn't load — surfaces the error instead of hanging. */
function ProfileError() {
  const error = useSession((s) => s.error);
  const session = useSession((s) => s.session);
  const signOut = useSession((s) => s.signOut);
  const loadProfile = useSession((s) => s.loadProfile);
  return (
    <StageViewport>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
        }}
      >
        <div style={{ fontFamily: "Corpta", fontSize: 20, color: "var(--p1)" }}>
          PROFILE ERROR
        </div>
        <div style={{ fontSize: 13, color: "var(--dim)", maxWidth: 520, textAlign: "center" }}>
          {error ?? "Unknown error loading your profile."}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            className="btn"
            style={{ padding: "10px 18px" }}
            onClick={() => {
              if (session?.user) void loadProfile(session.user.id);
            }}
          >
            Retry
          </button>
          <button
            type="button"
            className="btn ghost"
            style={{ padding: "10px 18px" }}
            onClick={() => void signOut()}
          >
            Sign Out
          </button>
        </div>
      </div>
    </StageViewport>
  );
}

/** Role-based landing: sends the signed-in user to the right surface. */
function RoleRedirect() {
  const session = useSession((s) => s.session);
  const profile = useSession((s) => s.profile);
  const status = useSession((s) => s.status);
  if (!session) return <Navigate to="/login" replace />;
  if (status === "error") return <ProfileError />;
  if (!profile) return <Splash text="LOADING PROFILE…" />;
  return <Navigate to={profile.role === "gm" ? "/admin" : "/portal"} replace />;
}

/** Guards a surface: must be signed in AND have the required role. */
function Guard({
  role,
  children,
}: {
  role: "gm" | "player";
  children: React.ReactNode;
}) {
  const { session, profile, status } = useSession();

  if (!session) return <Navigate to="/login" replace />;
  if (status === "error") return <ProfileError />;
  if (!profile) return <Splash text="LOADING PROFILE…" />;
  if (profile.role !== role) {
    // Wrong surface for this role — bounce to their correct home.
    return <Navigate to={profile.role === "gm" ? "/admin" : "/portal"} replace />;
  }
  return <>{children}</>;
}

function LoginRoute() {
  const profile = useSession((s) => s.profile);
  // Keep LoginScreen mounted through the sign-in attempt so its busy/error state
  // survives. Redirect only once a profile is actually loaded.
  if (profile) {
    return <Navigate to={profile.role === "gm" ? "/admin" : "/portal"} replace />;
  }
  return <LoginScreen />;
}

export function App() {
  const init = useSession((s) => s.init);
  const booted = useSession((s) => s.booted);

  useEffect(() => {
    void init();
  }, [init]);

  // Hold the whole app on a single boot splash until the initial session resolves,
  // so we never flash the login screen for a returning, already-signed-in user.
  if (!booted) return <Splash text="NETRUN OS" sub="Connecting…" />;

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route
          path="/portal"
          element={
            <Guard role="player">
              <PortalHome />
            </Guard>
          }
        />
        <Route
          path="/admin"
          element={
            <Guard role="gm">
              <AdminHome />
            </Guard>
          }
        />
        <Route path="/" element={<RoleRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
