// NETRUN OS — line-icon set (2D only). Stroke uses currentColor so callers set the
// color via tokens. Ported from the mock's iconography.

import type { ReactNode } from "react";

export function Glyph({ children, size = 22 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export type IconKey =
  | "home"
  | "profile"
  | "inventory"
  | "store"
  | "activities"
  | "contacts"
  | "story"
  | "pistol"
  | "shield"
  | "medkit"
  | "chip"
  | "drug"
  | "clock"
  | "star"
  | "cart"
  | "user"
  | "message"
  | "send"
  | "search"
  | "back";

const PATHS: Record<IconKey, ReactNode> = {
  home: (
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  inventory: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a4 4 0 018 0v2" />
    </>
  ),
  store: (
    <>
      <path d="M4 4h2l2 12h10l2-8H7" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </>
  ),
  activities: <polygon points="12,3 15,9 21,9 16,13 18,20 12,16 6,20 8,13 3,9 9,9" />,
  contacts: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
  story: (
    <>
      <path d="M12 3v18" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M12 6h6M12 18H6" />
    </>
  ),
  pistol: (
    <>
      <path d="M4 8h13l3 3h-4l-2 3h-4l-1-3H4z" />
      <path d="M6 11v3" />
    </>
  ),
  shield: <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />,
  medkit: (
    <>
      <path d="M9 3h6v3l3 6v7a2 2 0 01-2 2H8a2 2 0 01-2-2v-7l3-6z" />
      <path d="M12 12v4M10 14h4" />
    </>
  ),
  chip: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
    </>
  ),
  drug: <path d="M9 3h6v3l3 6v7a2 2 0 01-2 2H8a2 2 0 01-2-2v-7l3-6z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </>
  ),
  star: <polygon points="12,3 15,9 21,9 16,13 18,20 12,16 6,20 8,13 3,9 9,9" />,
  cart: (
    <>
      <path d="M4 4h2l2 12h10l2-8H7" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  message: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
  send: <path d="M4 12l16-7-7 16-2-6-7-3z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </>
  ),
  back: <path d="M15 5l-7 7 7 7" />,
};

export function Icon({ name, size = 22 }: { name: IconKey; size?: number }) {
  return <Glyph size={size}>{PATHS[name]}</Glyph>;
}
