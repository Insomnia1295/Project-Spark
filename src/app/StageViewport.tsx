// NETRUN OS — fit-scaler (plan §3.6).
// Scales the fixed 1600x1000 "scene" to fit the window, preserving aspect ratio,
// centered. GPU-composited (transform only) so it stays at 60fps on resize.

import { useEffect, useRef, type ReactNode } from "react";

// Fixed design stage — 16:9 so it fills standard monitors edge-to-edge.
const STAGE_W = 1600;
const STAGE_H = 900;

export function StageViewport({ children }: { children: ReactNode }) {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;

    const apply = () => {
      const scale = Math.min(
        window.innerWidth / STAGE_W,
        window.innerHeight / STAGE_H,
      );
      el.style.transform = `translate(-50%, -50%) scale(${scale})`;
    };

    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  return (
    <div className="stage-viewport">
      <div className="scene" ref={sceneRef}>
        {children}
      </div>
    </div>
  );
}
