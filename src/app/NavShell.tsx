// NETRUN OS — app shell chrome (logo + f1c nav). Chrome only; tab content lands in
// later phases. Nav items are data-driven so surfaces can differ (portal vs admin).

import type { ReactNode } from "react";
import { StageViewport } from "./StageViewport";

export interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
}

function Icon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// A small set of line icons (portal + admin share the vocabulary).
export const icons = {
  home: <Icon d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />,
  character: <Icon d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6" />,
  contacts: <Icon d="M4 5h16v14H4zM8 9h8M8 13h5" />,
  quests: <Icon d="M6 3h9l3 3v15H6zM9 9h6M9 13h6" />,
  session: <Icon d="M3 6h18v12H3zM3 10h18M8 6v12" />,
  store: <Icon d="M4 8h16l-1 12H5zM8 8a4 4 0 018 0" />,
  admin: <Icon d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7z" />,
};

export function NavShell({
  brand,
  items,
  children,
}: {
  brand: string;
  items: NavItem[];
  children: ReactNode;
}) {
  return (
    <StageViewport>
      <div className="logo">
        <div className="m">{brand}</div>
      </div>

      <nav className="menu" aria-label="Primary">
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            className={`mi${it.active ? " on" : ""}`}
            aria-current={it.active ? "page" : undefined}
          >
            <span className="ico">{it.icon}</span>
            <span className="lbl">{it.label}</span>
            {!it.active && <span className="dot" aria-hidden="true" />}
          </button>
        ))}
      </nav>

      {children}
    </StageViewport>
  );
}
