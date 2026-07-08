// NETRUN OS — Contacts tab. Encrypted-channel list + a chat thread area (empty) + a
// compose bar labelled "routes to your GM". Display-only this phase (messaging is Phase 11).

import { useMemo, useState } from "react";
import { Panel, Avatar, SectionHeader, Icon } from "@/app/ui";
import type { Contact } from "@/schemas";
import { useContacts } from "../data";
import { ScreenFrame } from "./common";

const initialOf = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

export function ContactsScreen() {
  const { data, isLoading, error } = useContacts();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const contacts = useMemo(() => (data ?? []).slice().sort((a, b) => a.sort - b.sort), [data]);
  const selected: Contact | undefined = contacts.find((c) => c.id === selectedId) ?? contacts[0];

  return (
    <ScreenFrame kicker="Encrypted Relay · routes to GM" title="CONTACTS" loading={isLoading} error={error?.message}>
      {/* Channel list */}
      <Panel accent style={{ left: 130, top: 130, width: 404, height: 600, padding: "16px 18px", overflow: "hidden" }}>
        <SectionHeader title="CHANNELS" meta={String(contacts.length)} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--inset2)",
            border: "1px solid var(--str)",
            borderRadius: 10,
            padding: "10px 13px",
            margin: "14px 0 12px",
            color: "var(--dim)",
          }}
        >
          <Icon name="search" size={18} />
          <span style={{ font: "300 13px Inter" }}>Search contacts…</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 456, overflowY: "auto", paddingRight: 4 }}>
          {contacts.map((c) => {
            const on = c.id === (selected?.id ?? "");
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "13px 14px",
                  borderRadius: 11,
                  border: "1px solid var(--str)",
                  borderColor: on ? "var(--p1)" : "var(--str)",
                  background: on ? "linear-gradient(90deg, rgba(255,90,168,.14), transparent)" : "var(--inset2)",
                  textAlign: "left",
                }}
              >
                <Avatar initial={initialOf(c.name)} online={c.online} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "Corpta", fontSize: 16 }}>{c.name}</div>
                  <div style={{ font: "300 13px Inter", color: "var(--faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    No messages yet
                  </div>
                </div>
                <span style={{ font: "300 9px Inter", color: "var(--p1)" }}>{c.relationship.toUpperCase()}</span>
              </button>
            );
          })}
        </div>
      </Panel>

      {/* Thread */}
      <Panel style={{ left: 560, top: 130, width: 1000, height: 600, padding: 0, display: "flex", flexDirection: "column" }}>
        {selected ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "18px 24px", borderBottom: "1px solid var(--str)" }}>
              <Avatar initial={initialOf(selected.name)} online={selected.online} size={48} />
              <div>
                <div style={{ fontFamily: "Corpta", fontSize: 20 }}>{selected.name.toUpperCase()}</div>
                <div style={{ font: "300 12px Inter", color: selected.online ? "var(--ok)" : "var(--faint)" }}>
                  {selected.online ? "● ONLINE" : "○ OFFLINE"} · {selected.relationship.toUpperCase()}
                </div>
              </div>
              <div style={{ marginLeft: "auto", font: "700 10px Inter", color: "var(--p1)", border: "1px solid var(--p1)", borderRadius: 6, padding: "5px 10px" }}>
                ENCRYPTED
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: "var(--faint)", padding: "26px 30px" }}>
              <Icon name="message" size={40} />
              <div style={{ fontFamily: "Corpta", fontSize: 16, letterSpacing: 1, marginTop: 14, color: "var(--dim)" }}>
                NO MESSAGES YET
              </div>
              <div style={{ font: "300 13px Inter", marginTop: 6, maxWidth: 300 }}>
                Start a secure thread — messages route to your GM.
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 24px", borderTop: "1px solid var(--str)" }}>
              <div style={{ flex: 1, background: "var(--inset)", border: "1px solid var(--str)", borderRadius: 10, padding: "14px 16px", font: "300 14px Inter", color: "var(--faint)" }}>
                Message routes to your GM… (messaging arrives in Phase 11)
              </div>
              <button type="button" className="ic" disabled title="Messaging arrives in Phase 11" aria-label="Send">
                <Icon name="send" size={22} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ margin: "auto", fontFamily: "Corpta", color: "var(--faint)", letterSpacing: 1 }}>NO CONTACTS</div>
        )}
      </Panel>
    </ScreenFrame>
  );
}
