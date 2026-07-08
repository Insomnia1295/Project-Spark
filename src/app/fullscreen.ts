// NETRUN OS — full screen toggle. Inside the packaged app, uses the Tauri window API for
// real OS-level full screen (borderless, covers the whole monitor, no taskbar — like a
// game). In a plain browser/dev-preview context (no Tauri runtime), falls back to the
// standard Fullscreen API so the toggle still works there. A small bottom-left button
// stands in for this control until a Settings tab exists (out of scope this phase).

import { useCallback, useEffect, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";

export function useFullscreen() {
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    let disposed = false;
    let disposeListener: (() => void) | null = null;

    async function setupTauri() {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      const current = await win.isFullscreen();
      if (disposed) return;
      setFullscreen(current);
      const unlisten = await win.onResized(() => {
        void win.isFullscreen().then((v) => {
          if (!disposed) setFullscreen(v);
        });
      });
      if (disposed) {
        unlisten();
      } else {
        disposeListener = unlisten;
      }
    }

    function setupWeb() {
      const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
      document.addEventListener("fullscreenchange", onChange);
      onChange();
      disposeListener = () => document.removeEventListener("fullscreenchange", onChange);
    }

    if (isTauri()) {
      void setupTauri();
    } else {
      setupWeb();
    }

    return () => {
      disposed = true;
      disposeListener?.();
    };
  }, []);

  const toggle = useCallback(() => {
    void (async () => {
      if (isTauri()) {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const win = getCurrentWindow();
        const current = await win.isFullscreen();
        await win.setFullscreen(!current);
        setFullscreen(!current);
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    })();
  }, []);

  return { fullscreen, toggle };
}
