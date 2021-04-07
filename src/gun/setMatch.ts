import { Deck, InternalMatch } from "mtgatool-shared";
import { GunMatch } from "../types/gunTypes";

export default function setMatch(match: InternalMatch) {
  const { gun } = window;

  const newGunMatch: GunMatch = {
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
  gun
    .user()
    .get("matches")
    .get(match.id)
    .put(newGunMatch as never);
}
