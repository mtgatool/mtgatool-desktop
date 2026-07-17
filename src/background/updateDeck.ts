import postChannelMessage from "../broadcastChannel/postChannelMessage";
import forceDeckUpdate from "./forceDeckUpdate";
import getOpponentDeck from "./getOpponentDeck";
import globalStore from "./store";
import { OverlayUpdateMatchState } from "./store/types";

function updateDeck(): void {
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

  postChannelMessage({
    type: "OVERLAY_UPDATE",
    value: currentMatchCopy,
  });
  // Live-share publishing now happens in the overlay window (see
  // overlay/index.tsx) — it's a visible window, so its Realtime socket isn't
  // throttled the way this hidden background window's would be.
}

export default updateDeck;
