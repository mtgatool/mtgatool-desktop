import { useCallback } from "react";
import postChannelMessage from "../broadcastChannel/postChannelMessage";

type HoverCardHook = (() => void)[];

export default function useHoverCard(
  card: number,
  wanted?: number
): HoverCardHook {
  const hoverIn = useCallback((): void => {
    postChannelMessage({ type: "HOVER_IN", value: card });
  }, [card, wanted]);

  const hoverOut = useCallback((): void => {
    postChannelMessage({ type: "HOVER_OUT" });
  }, []);

  return [hoverIn, hoverOut];
}
