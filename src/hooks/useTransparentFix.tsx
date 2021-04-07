import { remote } from "electron";
import { useCallback, useLayoutEffect, useRef } from "react";
import globalData from "../utils/globalData";

export default function useTransparentFix(debug?: boolean) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const doMouseFix = useCallback((event) => {
    // eslint-disable-next-line global-require
    const { setIgnoreMouseEvents } = remote.getCurrentWindow();

    const target = event.target as HTMLElement;
    if (debug) console.log(target.classList, event);
    globalData.mouseX = event.clientX;
    globalData.mouseY = event.clientY;
    if (target?.classList?.contains("click-through") || target?.id == "root") {
      setIgnoreMouseEvents(true, { forward: true });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // timeoutRef.current = setTimeout(() => {
      //  setIgnoreMouseEvents(false);
      // }, 500);
    } else {
      setIgnoreMouseEvents(false);
    }
  }, []);

  // Unmount this! very importante
  useLayoutEffect(() => {
    console.warn("useLayoutEffect");
    window.addEventListener("mousemove", doMouseFix);
    return () => window.removeEventListener("mousemove", doMouseFix);
  }, []);
}
