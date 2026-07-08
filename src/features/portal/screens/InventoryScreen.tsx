// NETRUN OS — Inventory tab. Category sub-tabs, a 4-up card grid, and a detail panel.
// Steven's real gear from inventory_item (weapons, armor SP, ammo, cyberware, medical, cash).
// Read-only this phase (equip/drop are Phase 2).

import { useMemo, useState } from "react";
import { Panel, Card, CategoryTabs, IconBox, type IconKey } from "@/app/ui";
import type { InventoryCategory, InventoryItem } from "@/schemas";
import { useInventory } from "../data";
import { ScreenFrame } from "./common";

type Filter = "all" | InventoryCategory;

const FILTERS: ReadonlyArray<{ key: Filter; label: string }> = [
  { key: "all", label: "ALL" },
  { key: "weapon", label: "WEAPONS" },
  { key: "armor", label: "ARMOR" },
  { key: "utility", label: "UTILITY" },
  { key: "implant", label: "IMPLANTS" },
  { key: "junk", label: "JUNK" },
];

const CATEGORY_ICON: Record<InventoryCategory, IconKey> = {
  weapon: "pistol",
  armor: "shield",
  utility: "medkit",
  implant: "chip",
  junk: "chip",
};

export function InventoryScreen() {
  const { data, isLoading, error } = useInventory();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const items = useMemo(
    () => (data ?? []).slice().sort((a, b) => a.sort - b.sort),
    [data],
  );
  const visible = filter === "all" ? items : items.filter((i) => i.category === filter);
  const selected: InventoryItem | undefined =
    visible.find((i) => i.id === selectedId) ?? visible[0];

  return (
    <ScreenFrame kicker="Loadout & Stash" title="INVENTORY" loading={isLoading} error={error?.message}>
      <div style={{ position: "absolute", left: 130, top: 130, width: 1046 }}>
        <CategoryTabs
          tabs={FILTERS}
          active={filter}
          onSelect={(k) => {
            setFilter(k);
            setSelectedId(null);
          }}
        />
      </div>

      <div style={{ position: "absolute", left: 130, top: 190, width: 1046, height: 560, overflowY: "auto", paddingRight: 6 }}>
        <div className="grid4">
          {visible.map((it) => (
            <Card
              key={it.id}
              accent={it.id === (selected?.id ?? "")}
              tap
              onClick={() => setSelectedId(it.id)}
              style={{ padding: 14 }}
            >
              {it.equipped && <span className="tag">EQUIP</span>}
              <IconBox name={CATEGORY_ICON[it.category]} />
              <div className="itemname">{it.name}</div>
              <div className="itemmeta">
                <span className="sub">{it.subtitle}</span>
                <span className="qty">×{it.qty}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <Panel accent style={{ left: 1202, top: 130, width: 358, height: 620, padding: "20px 24px" }}>
        {selected ? (
          <>
            <div style={{ fontFamily: "Corpta", fontSize: 17, letterSpacing: 2, color: "var(--pure)" }}>DETAIL</div>
            <div
              style={{
                width: "100%",
                height: 150,
                borderRadius: 12,
                background: "var(--inset)",
                border: "1px solid var(--str)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--p1)",
                marginTop: 16,
              }}
            >
              <IconBox name={CATEGORY_ICON[selected.category]} size={52} />
            </div>
            <div style={{ fontFamily: "Corpta", fontSize: 20, marginTop: 16, letterSpacing: 0.5 }}>
              {selected.name.toUpperCase()}
            </div>
            <div style={{ font: "300 12px Inter", color: "var(--dim)", marginTop: 4 }}>
              {[selected.subtitle, selected.damage, selected.rof ? `ROF ${selected.rof}` : null, selected.mag ? `Mag ${selected.mag}` : null]
                .filter(Boolean)
                .join(" · ")}
            </div>
            {selected.detail && (
              <div style={{ font: "300 13px Inter", color: "var(--dim)", lineHeight: 1.5, marginTop: 12 }}>
                {selected.detail}
              </div>
            )}
            <div style={{ font: "300 12px Inter", color: "var(--faint)", marginTop: 18 }}>
              Quantity: <b style={{ color: "var(--ink)" }}>×{selected.qty}</b>
              {selected.equipped ? " · Equipped" : ""}
            </div>
          </>
        ) : (
          <div style={{ fontFamily: "Corpta", color: "var(--faint)", letterSpacing: 1 }}>NO ITEMS</div>
        )}
      </Panel>
    </ScreenFrame>
  );
}
