import { useCallback } from "react";
import { useDispatch } from "react-redux";

import postChannelMessage from "../broadcastChannel/postChannelMessage";
import reduxAction from "../redux/reduxAction";
import { TAURI_LABEL_MAIN, WINDOW_MAIN } from "../types/app";
import isTauri from "../utils/tauri/isTauri";

type HoverCardHook = (() => void)[];

// Get current window label/title
function getWindowLabel(): string {
  if (isTauri()) {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const { getCurrentWindow } = require("@tauri-apps/api/window");
    return getCurrentWindow().label || "main";
  }
  return WINDOW_MAIN;
}

export default function useHoverCard(
  card: number,
  wanted?: number
): HoverCardHook {
  const dispatcher = useDispatch();

  const hoverIn = useCallback((): void => {
    const label = getWindowLabel();
    if (label !== WINDOW_MAIN && label !== TAURI_LABEL_MAIN) {
      postChannelMessage({ type: "HOVER_IN", value: card });
    }
    reduxAction(dispatcher, {
      type: "SET_HOVER_IN",
      arg: { grpId: card },
    });
  }, [dispatcher, card, wanted]);

  const hoverOut = useCallback((): void => {
    const label = getWindowLabel();
    if (label !== WINDOW_MAIN && label !== TAURI_LABEL_MAIN) {
      postChannelMessage({ type: "HOVER_OUT" });
    }
    reduxAction(dispatcher, {
      type: "SET_HOVER_OUT",
      arg: {},
    });
  }, [dispatcher]);

  return [hoverIn, hoverOut];
}
