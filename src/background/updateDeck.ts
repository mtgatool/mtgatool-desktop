import { objectClone } from "mtgatool-shared";
import postChannelMessage from "../broadcastChannel/postChannelMessage";
import forceDeckUpdate from "./forceDeckUpdate";
import getOpponentDeck from "./getOpponentDeck";
import globalStore from "./store";
import { MatchState, OverlayUpdateMatchState } from "./store/types";

function updateDeck(): void {
  forceDeckUpdate();
  const { currentMatch } = globalStore;

  const currentMatchCopy: OverlayUpdateMatchState = {
    ...objectClone<MatchState>(currentMatch),
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
}

export default updateDeck;
