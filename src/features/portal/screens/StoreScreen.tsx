// NETRUN OS — Store tab. Status bar (open + closes-in countdown), category sub-tabs,
// a 4-up product grid, and a Cart panel with total. VIEW-ONLY this phase — the cart is
// ephemeral (client-only) and checkout is disabled; buying arrives in Phase 13.

import { useEffect, useMemo, useState } from "react";
import { Panel, Card, CategoryTabs, IconBox, type IconKey } from "@/app/ui";
import type { CatalogCategory, CatalogItem } from "@/schemas";
import { useCatalog, useStoreSettings } from "../data";
import { ScreenFrame } from "./common";

type Filter = "all" | CatalogCategory;

const FILTERS: ReadonlyArray<{ key: Filter; label: string }> = [
  { key: "all", label: "ALL" },
  { key: "weapon", label: "WEAPONS" },
  { key: "armor", label: "ARMOR" },
  { key: "utility", label: "UTILITY" },
  { key: "implant", label: "IMPLANTS" },
];

const CATEGORY_ICON: Record<CatalogCategory, IconKey> = {
  weapon: "pistol",
  armor: "shield",
  utility: "medkit",
  implant: "chip",
};

/** HH:MM:SS remaining until `iso`, or null if past / absent. */
function countdown(iso: string | null, now: number): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export function StoreScreen() {
  const { data, isLoading, error } = useCatalog();
  const { store } = useStoreSettings();
  const [filter, setFilter] = useState<Filter>("all");
  const [cart, setCart] = useState<CatalogItem[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const items = useMemo(() => (data ?? []).slice().sort((a, b) => a.sort - b.sort), [data]);
  const visible = filter === "all" ? items : items.filter((i) => i.category === filter);
  const total = cart.reduce((sum, i) => sum + i.price, 0);
  const remaining = countdown(store?.closes_at ?? null, now);

  return (
    <ScreenFrame kicker="Black Market Terminal" title="STORE" loading={isLoading} error={error?.message}>
      {/* Status bar */}
      <Panel
        accent
        style={{ left: 130, top: 130, width: 1046, height: 58, padding: "0 24px", display: "flex", alignItems: "center", gap: 16 }}
      >
        <span
          style={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            background: store?.is_open ? "var(--ok)" : "var(--faint)",
            boxShadow: store?.is_open ? "0 0 12px var(--ok)" : "none",
          }}
        />
        <span style={{ fontFamily: "Corpta", fontSize: 18, letterSpacing: 1 }}>
          {store?.is_open ? "STORE OPEN" : "STORE CLOSED"}
        </span>
        {store?.is_open && remaining && (
          <span style={{ font: "700 12px Inter", color: "var(--p1)" }}>CLOSES IN {remaining}</span>
        )}
        <span style={{ marginLeft: "auto", font: "300 12px Inter", color: "var(--dim)" }}>
          {store?.note ?? "Same catalog for the crew · view-only this phase"}
        </span>
      </Panel>

      {/* Category sub-tabs */}
      <div style={{ position: "absolute", left: 130, top: 208, width: 1046 }}>
        <CategoryTabs tabs={FILTERS} active={filter} onSelect={setFilter} />
      </div>

      {/* Product grid */}
      <div style={{ position: "absolute", left: 130, top: 264, width: 1046, height: 486, overflowY: "auto", paddingRight: 6 }}>
        <div className="grid4">
          {visible.map((it) => (
            <Card key={it.id} accent tap style={{ padding: "15px 15px 14px" }}>
              <IconBox name={CATEGORY_ICON[it.category]} />
              <div className="itemname" style={{ marginTop: 12 }}>{it.name}</div>
              <div className="itemmeta" style={{ marginTop: 3 }}>
                <span className="sub">{it.subtitle}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                <span style={{ fontFamily: "Corpta", fontSize: 18, color: "var(--p2)" }}>
                  {it.price.toLocaleString()}
                  <span style={{ font: "400 10px Inter", color: "var(--dim)" }}> eb</span>
                </span>
                <button
                  type="button"
                  className="btn"
                  style={{ fontSize: 12, padding: "6px 12px" }}
                  onClick={() => setCart((c) => [...c, it])}
                  title="Add to cart (view-only)"
                >
                  ADD
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart (view-only) */}
      <Panel accent style={{ left: 1202, top: 130, width: 358, height: 620, padding: "20px 22px" }}>
        <div style={{ fontFamily: "Corpta", fontSize: 17, letterSpacing: 2, display: "flex" }}>
          CART
          <span style={{ marginLeft: "auto", font: "700 10px Inter", color: "var(--faint)" }}>
            {cart.length} ITEM{cart.length === 1 ? "" : "S"}
          </span>
        </div>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 11, maxHeight: 430, overflowY: "auto" }}>
          {cart.map((c, idx) => (
            <div
              key={`${c.id}-${idx}`}
              className="inset-row"
              role="button"
              tabIndex={0}
              onClick={() => setCart((cur) => cur.filter((_, i) => i !== idx))}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setCart((cur) => cur.filter((_, i) => i !== idx));
              }}
              style={{ cursor: "pointer" }}
              title="Remove"
            >
              <span style={{ font: "300 13px Inter" }}>{c.name}</span>
              <span style={{ fontFamily: "Corpta", fontSize: 14, color: "var(--p2)" }}>{c.price.toLocaleString()} eb</span>
            </div>
          ))}
          {cart.length === 0 && (
            <div style={{ font: "300 13px Inter", color: "var(--faint)" }}>Cart is empty — tap ADD on a product.</div>
          )}
        </div>
        <div style={{ position: "absolute", left: 22, right: 22, bottom: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Corpta", fontSize: 18, padding: "14px 0", borderTop: "1px solid var(--str)" }}>
            <span>TOTAL</span>
            <span style={{ color: "var(--p2)" }}>{total.toLocaleString()} eb</span>
          </div>
          <button type="button" className="btn" disabled style={{ padding: "12px 0", width: "100%" }} title="Buying arrives in Phase 13">
            CHECKOUT ▸ (PHASE 13)
          </button>
        </div>
      </Panel>
    </ScreenFrame>
  );
}
