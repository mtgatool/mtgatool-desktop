import { useCallback } from "react";
import { useDispatch } from "react-redux";
import postChannelMessage from "../broadcastChannel/postChannelMessage";
import reduxAction from "../redux/reduxAction";

type HoverCardHook = (() => void)[];

export default function useHoverCard(
  card: number,
  wanted?: number
): HoverCardHook {
  const dispatcher = useDispatch();

  const hoverIn = useCallback((): void => {
    postChannelMessage({ type: "HOVER_IN", value: card });
    reduxAction(dispatcher, {
      type: "SET_HOVER_IN",
      arg: { grpId: card },
    });
  }, [dispatcher, card, wanted]);

  const hoverOut = useCallback((): void => {
    postChannelMessage({ type: "HOVER_OUT" });
    reduxAction(dispatcher, {
      type: "SET_HOVER_OUT",
      arg: {},
    });
  }, [dispatcher]);

  return [hoverIn, hoverOut];
}
