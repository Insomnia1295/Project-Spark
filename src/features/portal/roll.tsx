// NETRUN OS — click-to-roll (Phase 1 §3). Skill/stat clicks resolve through the
// server-authoritative `roll` Edge Function (CP RED crit/fumble); the result shows in
// a bottom-center toast. The client never rolls consequential dice locally.

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { rollResponseSchema, type RollResponse } from "@/schemas";

export interface RollParams {
  stat?: number;
  skill?: number;
  mods?: number;
  kind?: string;
}

interface RollState {
  label: string;
  pending: boolean;
  result: RollResponse | null;
  error: string | null;
}

interface RollApi {
  roll: (label: string, params: RollParams) => void;
}

const RollContext = createContext<RollApi | null>(null);

export function useRoll(): RollApi {
  const ctx = useContext(RollContext);
  if (!ctx) throw new Error("useRoll must be used within <RollProvider>");
  return ctx;
}

export function RollProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RollState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissLater = useCallback((ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState(null), ms);
  }, []);

  const roll = useCallback(
    (label: string, params: RollParams) => {
      if (timer.current) clearTimeout(timer.current);
      setState({ label, pending: true, result: null, error: null });
      void (async () => {
        const { data, error } = await supabase.functions.invoke("roll", {
          body: { ...params, kind: params.kind ?? "portal" },
        });
        if (error) {
          setState({ label, pending: false, result: null, error: error.message });
          dismissLater(4000);
          return;
        }
        const parsed = rollResponseSchema.safeParse(data);
        if (!parsed.success) {
          setState({ label, pending: false, result: null, error: "Bad roll response." });
          dismissLater(4000);
          return;
        }
        setState({ label, pending: false, result: parsed.data, error: null });
        dismissLater(5000);
      })();
    },
    [dismissLater],
  );

  return (
    <RollContext.Provider value={{ roll }}>
      {children}
      {state && <RollToast state={state} onClose={() => setState(null)} />}
    </RollContext.Provider>
  );
}

function RollToast({ state, onClose }: { state: RollState; onClose: () => void }) {
  const r = state.result;
  const cls = r?.critical ? " crit" : r?.fumble ? " fumble" : "";
  return (
    <div className={`roll-toast${cls}`} onClick={onClose} role="status">
      <div className="die">{r ? r.total : state.pending ? "…" : "!"}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "Corpta", fontSize: 15, letterSpacing: 1 }}>
          {state.label.toUpperCase()}
        </div>
        <div style={{ font: "300 12px Inter", color: "var(--dim)", marginTop: 3 }}>
          {state.pending && "Rolling on the server…"}
          {state.error && <span style={{ color: "var(--p1)" }}>{state.error}</span>}
          {r && (
            <>
              d10 = {r.die}
              {r.extraDie !== null && (r.critical ? ` +${r.extraDie}` : ` −${r.extraDie}`)} → total{" "}
              <b style={{ color: "var(--ink)" }}>{r.total}</b>
              {r.critical && <span style={{ color: "var(--ok)" }}> · CRIT</span>}
              {r.fumble && <span style={{ color: "var(--warm)" }}> · FUMBLE</span>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
