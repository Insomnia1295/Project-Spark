// NETRUN OS — Realtime smoke test (dev only). De-risks the live Session arena.
// Presence = who's joined; Broadcast = echo a message. Open two app instances and
// each should see the other's presence and receive broadcasts.

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session";

interface Echo {
  from: string;
  text: string;
  at: string;
}

export function RealtimeSmoke() {
  const profile = useSession((s) => s.profile);
  const me = profile?.display_name ?? "anon";

  const channelRef = useRef<RealtimeChannel | null>(null);
  const [online, setOnline] = useState<string[]>([]);
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const clientId = `${me}-${Math.floor(Math.random() * 1e6)}`;
    const channel = supabase.channel("smoke-test", {
      config: { presence: { key: clientId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ name: string }>();
        const names = Object.values(state)
          .flat()
          .map((p) => p.name);
        setOnline(names);
      })
      .on("broadcast", { event: "ping" }, (payload) => {
        const data = payload["payload"] as Echo;
        setEchoes((prev) => [data, ...prev].slice(0, 12));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          void channel.track({ name: me });
        }
      });

    channelRef.current = channel;
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [me]);

  function sendPing() {
    channelRef.current?.send({
      type: "broadcast",
      event: "ping",
      payload: {
        from: me,
        text: `hello from ${me}`,
        at: new Date().toLocaleTimeString(),
      } satisfies Echo,
    });
  }

  return (
    <div className="cd" style={{ padding: 18 }}>
      <div className="hh" style={{ marginBottom: 12 }}>
        <span>REALTIME SMOKE</span>
        <span
          className="cnt"
          style={{ color: connected ? "var(--ok)" : "var(--faint)" }}
        >
          {connected ? "● LIVE" : "○ …"}
        </span>
      </div>

      <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 8 }}>
        Presence ({online.length}):{" "}
        <span style={{ color: "var(--ink)" }}>{online.join(", ") || "—"}</span>
      </div>

      <button
        type="button"
        className="btn"
        onClick={sendPing}
        disabled={!connected}
        style={{ padding: "9px 16px", marginBottom: 12 }}
      >
        Broadcast Ping
      </button>

      <div style={{ maxHeight: 140, overflow: "auto" }}>
        {echoes.map((e, i) => (
          <div
            key={i}
            style={{ fontSize: 12, color: "var(--dim)", padding: "3px 0" }}
          >
            <span style={{ color: "var(--p2)" }}>[{e.at}]</span> {e.from}: {e.text}
          </div>
        ))}
        {echoes.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--faint)" }}>
            No pings yet — open a second instance and click Broadcast.
          </div>
        )}
      </div>
    </div>
  );
}
