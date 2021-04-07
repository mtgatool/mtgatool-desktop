import { objectClone } from "mtgatool-shared";
import postChannelMessage from "../broadcastChannel/postChannelMessage";
import forceDeckUpdate from "./forceDeckUpdate";
import getOpponentDeck from "./getOpponentDeck";
import globalStore from "./store";

function updateDeck(): void {
  forceDeckUpdate();
  const { currentMatch } = globalStore;

  const currentMatchCopy = objectClone<any>(currentMatch);
  currentMatchCopy.oppCards = getOpponentDeck();
  currentMatchCopy.playerCardsLeft = currentMatch.cardsLeft.getSave();
  currentMatchCopy.playerCardsOdds = currentMatch.cardsOdds;
  currentMatchCopy.player.deck = currentMatch.currentDeck.getSave();
  currentMatchCopy.player.originalDeck = currentMatch.originalDeck.getSave();
  delete currentMatchCopy.GREtoClient;
  delete currentMatchCopy.oppCardsUsed;
  delete currentMatchCopy.playerChances;
  delete currentMatchCopy.annotations;
  delete currentMatchCopy.gameObjs;
  delete currentMatchCopy.latestMessage;
  delete currentMatchCopy.processedAnnotations;
  delete currentMatchCopy.zones;

  postChannelMessage({
    type: "OVERLAY_UPDATE",
    value: currentMatchCopy,
  });
}

export default updateDeck;
