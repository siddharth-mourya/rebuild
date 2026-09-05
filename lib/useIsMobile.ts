"use client";

import { useEffect, useState } from "react";

/** True below `breakpoint` px. Used to switch between the desktop 3-pane editor layout and the
 * mobile bottom-tab layout — they're structurally different, not just a CSS reflow, so only one
 * is ever mounted (rendering both would double up the PreviewPlayer's audio/video elements). */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}
