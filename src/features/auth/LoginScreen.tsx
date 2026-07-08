// NETRUN OS — login (email/password). After sign-in the router redirects by role.

import { useState, type FormEvent } from "react";
import { useSession } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase";
import { StageViewport } from "@/app/StageViewport";

export function LoginScreen() {
  const signIn = useSession((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await signIn(email.trim(), password);
    if (error) setError(error);
    setBusy(false);
  }

  return (
    <StageViewport>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5,
        }}
      >
        <div
          className="pn"
          style={{ width: 440, padding: "40px 40px 34px", position: "relative" }}
        >
          <div
            className="corpta gw"
            style={{
              fontFamily: "Corpta",
              fontSize: 34,
              letterSpacing: 2,
              color: "var(--ink)",
            }}
          >
            NETRUN OS
          </div>
          <div
            style={{
              fontSize: 12,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "var(--p1)",
              marginTop: 6,
              marginBottom: 26,
            }}
          >
            Player Portal · Access
          </div>

          {!isSupabaseConfigured && (
            <div
              style={{
                fontSize: 12,
                color: "var(--news)",
                border: "1px solid var(--str)",
                padding: "10px 12px",
                marginBottom: 18,
                lineHeight: 1.5,
              }}
            >
              Supabase not configured. Copy <code>.env.example</code> to{" "}
              <code>.env</code> and fill in the URL + anon key, then restart.
            </div>
          )}

          <form onSubmit={onSubmit}>
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoFocus
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
            />

            {error && (
              <div style={{ color: "var(--p1)", fontSize: 12, marginTop: 12 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn"
              disabled={busy || !isSupabaseConfigured}
              style={{ width: "100%", marginTop: 22, padding: "13px 0" }}
            >
              {busy ? "Connecting…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </StageViewport>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoFocus,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <span
        style={{
          display: "block",
          fontSize: 10,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "var(--dim)",
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          height: 44,
          padding: "0 14px",
          background: "var(--glass2)",
          border: "1px solid var(--str)",
          color: "var(--ink)",
          fontFamily: "Inter",
          fontSize: 14,
          outline: "none",
        }}
      />
    </label>
  );
}
