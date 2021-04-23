import { Deck, InternalMatch } from "mtgatool-shared";
import { GunDeck, GunMatch } from "../types/gunTypes";
import getLocalSetting from "../utils/getLocalSetting";
import objToBase from "../utils/objToBase";
import getGunUser from "./getGunUser";

export default async function setGunMatch(match: InternalMatch) {
  console.log("> Set match", match);

  const userRef = getGunUser();
  if (userRef) {
    const newGunMatch: GunMatch = {
      matchId: match.id,
      playerId: getLocalSetting("playerId"),
      playerDeckId: match.playerDeck.id,
      playerDeckHash: match.playerDeckHash,
      playerDeckColors: new Deck(match.playerDeck).colors.getBits(),
      oppDeckColors: new Deck(match.oppDeck).colors.getBits(),
      playerName: match.player.name,
      playerWins: match.player.wins,
      playerLosses: match.opponent.wins,
      eventId: match.eventId,
      duration: match.duration,
      internalMatch: objToBase(match),
      timestamp: new Date().getTime(),
    };

    userRef.get("matches").get(match.id).put(newGunMatch);

    const decksIndexRef = userRef.get("decksIndex");
    const decksRef = userRef.get("decks");
    const indexKeys = await decksIndexRef.then();

    const hasWon = match.player.wins > match.opponent.wins;

    if (Object.keys(indexKeys).includes(match.playerDeck.id)) {
      const deckIdRef = decksIndexRef.get(match.playerDeck.id);
      const version = await deckIdRef.then();
      const currentDeckKey = `${match.playerDeck.id}-v${version || 0}`;
      (decksRef as any).get(currentDeckKey).open(
        (currentDeck: GunDeck) => {
          console.log(currentDeck);
          console.log(Object.keys(currentDeck.matches));
          const stats = { ...currentDeck.stats };

          if (!Object.keys(currentDeck.matches).includes(match.id)) {
            stats.gameWins += match.player.wins;
            stats.gameLosses += match.opponent.wins;
            stats.matchWins += hasWon ? 1 : 0;
            stats.matchLosses += hasWon ? 0 : 1;
            console.log("stats", stats);
            decksRef.get(currentDeckKey).put({
              stats: stats,
              lastUsed: new Date().getTime(),
            });
            decksRef
              .get(currentDeckKey)
              .get("matches")
              .get(match.id)
              .put(hasWon);
          }
        },
        { off: true }
      );
    }
  }
}
