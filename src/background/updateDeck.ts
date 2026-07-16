import postChannelMessage from "../broadcastChannel/postChannelMessage";
import publishLiveShare from "../data/liveShare";
import forceDeckUpdate from "./forceDeckUpdate";
import getOpponentDeck from "./getOpponentDeck";
import { isLiveLog } from "./logReadState";
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

  // Mirror to any sharing-enabled overlay channels (public live view). Only
  // for the live log — never while replaying history.
  if (isLiveLog()) {
    publishLiveShare(currentMatchCopy);
  }
}

export default updateDeck;
