import { ArenaV3Deck, InternalDeck } from "../types";
import convertV3ListToV2 from "./convertV3ListToV2";
import Deck from "./mtga/deck";

export default function convertDeckFromV3(v3deck: ArenaV3Deck): Deck {
  const newMain = convertV3ListToV2(v3deck.mainDeck);
  const newSide = convertV3ListToV2([
    ...v3deck.sideboard,
    ...(v3deck.reducedSideboard || []),
  ]);
  const v2Deck: InternalDeck = {
    mainDeck: newMain,
    sideboard: newSide,
    id: v3deck.id,
    name: v3deck.name,
    lastUpdated: v3deck.lastUpdated,
    deckTileId: v3deck.deckTileId,
    commandZoneGRPIds: v3deck.commandZoneGRPIds,
    companionGRPId: v3deck.companionGRPId,
    format: v3deck.format,
    type: "InternalDeck",
  };
  const deck = new Deck(v2Deck);
  return deck;
}
