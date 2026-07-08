// NETRUN OS — asset registry (plan §8 / Phase 1 §5, §6).
// Screens reference art indirectly by ID; the registry resolves id -> source.
// Phase 1 ships TEMPORARY themed placeholders only — real art arrives with the
// Phase 4 asset library, which will swap `src` here WITHOUT touching any screen.

export interface AssetSource {
  /** Real image URL once art exists (Phase 4). Undefined -> render the placeholder. */
  src?: string;
  /** CSS background used while there's no real art (themed, never black). */
  placeholder: string;
  /** Short caption drawn over the placeholder so it's clearly a stand-in. */
  label?: string;
}

// TEMP placeholders. All are token-based gradients so they respect the theme.
const REGISTRY: Record<string, AssetSource> = {
  "hero.steven": {
    placeholder:
      "radial-gradient(60% 70% at 50% 40%, rgba(255,90,168,.35), transparent 70%), var(--grad-humanity)",
    label: "HERO",
  },
  "portrait.steven": {
    placeholder:
      "radial-gradient(80% 60% at 50% 30%, rgba(154,108,255,.4), transparent 70%), var(--grad-brand)",
    label: "PORTRAIT",
  },
  "wallpaper.portal": {
    placeholder:
      "radial-gradient(1200px 800px at 20% -10%, rgba(154,108,255,.14), transparent 60%), radial-gradient(1000px 700px at 90% 110%, rgba(255,90,168,.12), transparent 60%)",
  },
  "comic.session": {
    placeholder:
      "linear-gradient(135deg, rgba(255,90,168,.22), rgba(154,108,255,.16))",
    label: "COMIC PANEL",
  },
};

const FALLBACK: AssetSource = { placeholder: "var(--inset)" };

/** Resolve an asset id to its source (real art or a themed placeholder). */
export function asset(id: string): AssetSource {
  return REGISTRY[id] ?? FALLBACK;
}
