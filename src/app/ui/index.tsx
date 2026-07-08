// NETRUN OS — reusable Player Portal primitives (Phase 1 §5).
// Screens compose these; a restyle propagates from here + tokens, never per-screen.
// No raw colors here — all visuals come from token-driven classes (portal.css).

import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconKey } from "./icons";

export { Icon } from "./icons";
export type { IconKey } from "./icons";

/* ---- Panel: glass surface, optional accent bar ---- */
export function Panel({
  accent,
  className = "",
  style,
  children,
}: {
  accent?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div className={`pn${accent ? " acc" : ""}${className ? " " + className : ""}`} style={style}>
      {children}
    </div>
  );
}

/* ---- Card: angular card, optional accent + tappable ---- */
export function Card({
  accent,
  tap,
  onClick,
  className = "",
  style,
  children,
}: {
  accent?: boolean;
  tap?: boolean;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div
      className={`cd${accent ? " acc" : ""}${tap ? " tap" : ""}${className ? " " + className : ""}`}
      style={style}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

/* ---- Section header (skew ticks + title + right meta) ---- */
export function SectionHeader({ title, meta }: { title: string; meta?: ReactNode }) {
  return (
    <div className="hh">
      <span className="sl">
        <i />
        <i />
      </span>
      {title}
      {meta !== undefined && <span className="cnt">{meta}</span>}
    </div>
  );
}

/* ---- Page title (kicker + Corpta title) ---- */
export function PageTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="ttl" style={{ position: "absolute", left: 130, top: 32 }}>
      <div className="k">{kicker}</div>
      <div className="t gw">{title}</div>
    </div>
  );
}

/* ---- Header pill ---- */
export function Pill({
  label,
  value,
  unit,
  variant,
}: {
  label: string;
  value: string;
  unit?: string;
  variant?: "ft" | "ed";
}) {
  return (
    <div className={`pill${variant ? " " + variant : ""}`}>
      <div className="l">{label}</div>
      <div className="v">
        {value}
        {unit && <span className="u"> {unit}</span>}
      </div>
    </div>
  );
}

/* ---- Stat chip (Profile stats; tappable to roll d10 + stat) ---- */
export function StatChip({
  label,
  value,
  onRoll,
}: {
  label: string;
  value: number;
  onRoll?: () => void;
}) {
  return (
    <div
      className={`statchip${onRoll ? " tap" : ""}`}
      onClick={onRoll}
      role={onRoll ? "button" : undefined}
      tabIndex={onRoll ? 0 : undefined}
      onKeyDown={
        onRoll
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRoll();
              }
            }
          : undefined
      }
      title={onRoll ? `Roll d10 + ${label} ${value}` : undefined}
    >
      <div className="l">{label}</div>
      <div className="v">{value}</div>
    </div>
  );
}

/* ---- Labeled vital bar ---- */
export function VitalBar({
  label,
  right,
  fraction,
  variant,
}: {
  label: string;
  right?: string;
  fraction: number;
  variant?: "hp" | "humanity";
}) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <div className="vbar">
      <div className="row">
        <span>{label}</span>
        {right !== undefined && <span>{right}</span>}
      </div>
      <div className="track">
        <span className={`fill${variant === "hp" ? " hp" : ""}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ---- Segmented meter ---- */
export function Segmented({ filled, total, height }: { filled: number; total: number; height?: number }) {
  return (
    <div className="seg" style={height ? { height } : undefined}>
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={i < filled ? "on" : ""} />
      ))}
    </div>
  );
}

/* ---- Skill row (10 level pips + total; tappable to roll) ---- */
export function SkillRow({
  name,
  level,
  total,
  onRoll,
}: {
  name: string;
  level: number;
  total: number;
  onRoll?: () => void;
}) {
  return (
    <div
      className="skillrow"
      onClick={onRoll}
      role={onRoll ? "button" : undefined}
      tabIndex={onRoll ? 0 : undefined}
      onKeyDown={
        onRoll
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRoll();
              }
            }
          : undefined
      }
      title={onRoll ? `Roll d10 + ${name} (+${total})` : undefined}
    >
      <span className="nm">{name}</span>
      <span className="pips">
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} className={i < level ? "on" : ""} />
        ))}
      </span>
      <span className="tot">+{total}</span>
    </div>
  );
}

/* ---- Category tabs ---- */
export function CategoryTabs<T extends string>({
  tabs,
  active,
  onSelect,
}: {
  tabs: ReadonlyArray<{ key: T; label: string }>;
  active: T;
  onSelect: (key: T) => void;
}) {
  return (
    <div className="cattabs">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          className={`cattab${t.key === active ? " on" : ""}`}
          onClick={() => onSelect(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ---- Icon box (item tile icon) ---- */
export function IconBox({ name, size = 22 }: { name: IconKey; size?: number }) {
  return (
    <div className="iconbox">
      <Icon name={name} size={size} />
    </div>
  );
}

/* ---- Avatar circle with initial + online dot ---- */
export function Avatar({
  initial,
  online,
  size = 46,
}: {
  initial: string;
  online?: boolean;
  size?: number;
}) {
  return (
    <div
      className={`avatar${online ? " on" : ""}`}
      style={{ width: size, height: size, fontSize: size * 0.37 }}
    >
      {initial}
    </div>
  );
}

/* ---- Nav rail (portal tabs) ---- */
export interface RailItem {
  key: string;
  label: string;
  icon: IconKey;
  badge?: number;
  alert?: boolean;
}

export function NavRail({
  items,
  active,
  onSelect,
  forceOpen,
}: {
  items: RailItem[];
  active: string;
  onSelect: (key: string) => void;
  forceOpen?: boolean;
}) {
  return (
    <nav className={`menu${forceOpen ? " open" : ""}`} aria-label="Primary">
      {items.map((it) => {
        const on = it.key === active;
        return (
          <button
            key={it.key}
            type="button"
            className={`mi${on ? " on" : ""}`}
            aria-current={on ? "page" : undefined}
            onClick={() => onSelect(it.key)}
          >
            <span className="ico">
              <Icon name={it.icon} size={23} />
            </span>
            <span className="lbl">{it.label}</span>
            {it.badge !== undefined && it.badge > 0 && <span className="bd">{it.badge}</span>}
            {it.alert && !on && <span className="dot" aria-hidden="true" />}
          </button>
        );
      })}
    </nav>
  );
}
