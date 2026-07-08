// NETRUN OS — shared screen scaffolding (title + loading/error boundary).

import type { ReactNode } from "react";
import { PageTitle } from "@/app/ui";

/** Centered status message (loading / validation error / empty). */
export function StatusNote({
  children,
  tone = "dim",
}: {
  children: ReactNode;
  tone?: "dim" | "error";
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 130,
        top: 150,
        fontFamily: "Corpta",
        letterSpacing: 2,
        fontSize: 16,
        color: tone === "error" ? "var(--p1)" : "var(--faint)",
      }}
    >
      {children}
    </div>
  );
}

/** Screen with a page title and a loading/error boundary around its content. */
export function ScreenFrame({
  kicker,
  title,
  loading,
  error,
  children,
}: {
  kicker: string;
  title: string;
  loading?: boolean;
  error?: string | null | undefined;
  children: ReactNode;
}) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <PageTitle kicker={kicker} title={title} />
      {error ? (
        <StatusNote tone="error">{error}</StatusNote>
      ) : loading ? (
        <StatusNote>LOADING…</StatusNote>
      ) : (
        children
      )}
    </div>
  );
}

/** Placeholder for a tab not yet wired (kept runnable during the build). */
export function Placeholder({ title }: { title: string }) {
  return (
    <ScreenFrame kicker="Player Portal" title={title}>
      <StatusNote>COMING THIS PHASE…</StatusNote>
    </ScreenFrame>
  );
}
