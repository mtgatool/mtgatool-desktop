import postChannelMessage from "../broadcastChannel/postChannelMessage";
import forceDeckUpdate from "./forceDeckUpdate";
import getOpponentDeck from "./getOpponentDeck";
import { isLogLive } from "./logReadState";
import globalStore from "./store";
import { OverlayUpdateMatchState } from "./store/types";

// updateDeck() fires on every GREToClient game-state message, which during
// active play is many per second. Each post is broadcast cross-window to the
// overlays, so posting them all floods WebView2's IPC queue (0x80070718).
// Throttle to ~5/s with a trailing post so the overlay stays responsive and
// always ends on the final state.
const OVERLAY_MIN_INTERVAL = 200;
let lastOverlayPost = 0;
let trailingTimer: ReturnType<typeof setTimeout> | null = null;
let latestCopy: OverlayUpdateMatchState | null = null;

function flushOverlay(): void {
  if (!latestCopy) return;
  lastOverlayPost = Date.now();
  postChannelMessage({ type: "OVERLAY_UPDATE", value: latestCopy });
  latestCopy = null;
}

function updateDeck(): void {
  // During the historical catch-up read there is no live match on screen, so
  // building and broadcasting overlay updates for every replayed game-state
  // message is wasted work that floods the IPC. Overlay updates resume the
  // moment the log switches to live tailing.
  if (!isLogLive()) return;

  forceDeckUpdate();
  const { currentMatch } = globalStore;

  const currentMatchCopy: OverlayUpdateMatchState = {
    ...currentMatch,
    oppCards: getOpponentDeck(),
    playerCardsLeft: currentMatch.cardsLeft.getSave(),
    playerCardsOdds: currentMatch.cardsOdds,
    playerDeck: currentMatch.currentDeck.getSave(),
    playerOriginalDeck: currentMatch.originalDeck.getSave(),
  };

  delete currentMatchCopy.GREtoClient;
  delete currentMatchCopy.annotations;
  delete currentMatchCopy.processedAnnotations;
  delete currentMatchCopy.zones;

  latestCopy = currentMatchCopy;

  const since = Date.now() - lastOverlayPost;
  if (since >= OVERLAY_MIN_INTERVAL) {
    if (trailingTimer) {
      clearTimeout(trailingTimer);
      trailingTimer = null;
    }
    flushOverlay();
  } else if (!trailingTimer) {
    trailingTimer = setTimeout(() => {
      trailingTimer = null;
      flushOverlay();
    }, OVERLAY_MIN_INTERVAL - since);
  }
}

export default updateDeck;
