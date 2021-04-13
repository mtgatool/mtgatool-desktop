import { Deck, InternalMatch } from "mtgatool-shared";
import { GunDeck, GunMatch } from "../types/gunTypes";
import getLocalSetting from "../utils/getLocalSetting";
import getGraphKeys from "./getGraphKeys";
import getGraphObject from "./getGraphObject";
import getGunUser from "./getGunUser";

export default async function setGunMatch(match: InternalMatch) {
  const userRef = getGunUser();
  if (userRef) {
    const decksIndexRef = userRef.get("decksIndex");
    const decksRef = userRef.get("decks");
    const indexKeys = await getGraphKeys(decksIndexRef);

    const hasWon = match.player.wins > match.opponent.wins;

    if (indexKeys.includes(match.playerDeck.id)) {
      const deckIdRef = decksIndexRef.get(match.playerDeck.id);
      const version = deckIdRef.then ? await deckIdRef.then() : 0;
      const currentDeckKey = `${match.playerDeck.id}-v${version}`;
      const currentDeckRef = decksRef.get(currentDeckKey);
      const deckMatchesRef = currentDeckRef.get("matches");
      const matchesList = await getGraphKeys(deckMatchesRef);

      if (!matchesList.includes(match.id)) {
        // Upsert new stats and add match to the deck's list of matches
        const stats = await getGraphObject<GunDeck["stats"]>(
          currentDeckRef.get("stats")
        );
        stats.gameWins += match.player.wins;
        stats.gameLosses += match.opponent.wins;
        stats.matchWins += hasWon ? 1 : 0;
        stats.matchLosses += hasWon ? 0 : 1;
        currentDeckRef.get("stats").put(stats);
        currentDeckRef.get("matches").get(match.id).put(hasWon);
      }
    }

    const newGunMatch: GunMatch = {
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
      internalMatch: JSON.stringify(match),
      timestamp: new Date().getTime(),
    };

    userRef.get("matches").get(match.id).put(newGunMatch);
  }
}
