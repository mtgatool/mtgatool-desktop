import _ from "lodash";
import { MatchGameStats } from "mtgatool-shared";
import getDeckChanges from "./getDeckChanges";
import globalStore from "./store";
import { setMatchGameStats } from "./store/currentMatchStore";

export default function getMatchGameStats(): void {
  // This function should be able to be called multiple times, and not
  // modify state. So every time its called the result should be the same
  const { currentMatch } = globalStore;

  const players = currentMatch.players.map(
    (player) => player.systemSeatNumber || 0
  );

  // Calculate time of this game
  const time = players.reduce((acc, cur) => {
    return acc + currentMatch.priorityTimers.timers[cur];
  }, 0);

  // Get current number of games completed
  const gameNumberCompleted = currentMatch.gameInfo.results.filter(
    (res) => res.scope == "MatchScope_Game"
  ).length;

  const game: MatchGameStats = {
    time: Math.round(time / 1000),
    onThePlay: currentMatch.onThePlay,
    winner: currentMatch.gameWinner,
    handsDrawn: currentMatch.handsDrawn,
    cardsCast: _.cloneDeep(currentMatch.cardsCast),
    sideboardChanges: {
      added: [],
      removed: [],
    },
    cardsSeen: currentMatch.opponent.cardsUsed,
    deck: {
      id: "",
      commandZoneGRPIds: [],
      companionGRPId: 0,
      mainDeck: [],
      sideboard: [],
      name: "",
      deckTileId: 0,
      lastUpdated: new Date().toISOString(),
      format: "",
      description: "",
      type: "InternalDeck",
    },
  };

  if (gameNumberCompleted > 1) {
    const originalDeck = globalStore.currentMatch.originalDeck.clone();
    const newDeck = globalStore.currentMatch.currentDeck.clone();
    const sideboardChanges = getDeckChanges(
      newDeck,
      originalDeck,
      currentMatch.matchGameStats.slice(0, gameNumberCompleted - 1)
    );
    game.sideboardChanges = sideboardChanges;
    game.deck = newDeck.clone().getSave();
  }

  setMatchGameStats(gameNumberCompleted - 1, game);
}
