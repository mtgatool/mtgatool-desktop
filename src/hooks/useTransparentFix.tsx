import { useCallback, useLayoutEffect, useRef } from "react";

import globalData from "../utils/globalData";

/**
 * This hook was used in Electron to handle click-through behavior for transparent windows.
 * In Tauri, click-through is handled at the window configuration level.
 * This hook now just tracks mouse position for global data.
 */
export default function useTransparentFix(debug?: boolean) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const doMouseFix = useCallback(
    (event: MouseEvent) => {
      if (debug) {
        const target = event.target as HTMLElement;
        console.log(target.classList, event);
      }
      globalData.mouseX = event.clientX;
      globalData.mouseY = event.clientY;

      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    },
    [debug]
  );

  // Track mouse position
  useLayoutEffect(() => {
    window.addEventListener("mousemove", doMouseFix);
    return () => window.removeEventListener("mousemove", doMouseFix);
  }, [doMouseFix]);
}
