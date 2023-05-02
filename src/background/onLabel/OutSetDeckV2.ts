// import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import {
  CardsList,
  convertV4ListToV2,
  Deck,
  InternalDeck,
  v4cardsList,
} from "mtgatool-shared";

import LogEntry from "../../types/logDecoder";
import selectDeck from "../selectDeck";

interface Entry extends LogEntry {
  json: {
    EventName: string;
    Summary: {
      DeckId: string;
      Name?: string;
      Description: string | null;
      Attributes: {
        name: string;
        value: string;
      }[];
      DeckTileId: number;
      IsCompanionValid: boolean;
      FormatLegalities: Record<string, string>;
      DeckValidationSummaries: [];
      UnownedCards: Record<string, string>;
    };
    Deck: {
      MainDeck: v4cardsList;
      ReducedSideboard: v4cardsList;
      Sideboard: v4cardsList;
      CommandZone: v4cardsList;
      Companions: v4cardsList;
      CardSkins: v4cardsList;
      DoPreferReducedSideboard: boolean;
    };
  };
}

export default function OutSetDeckV2(entry: Entry): any {
  const { json } = entry;

  // Should make a standard function to conver these new format decks
  const main = convertV4ListToV2(json.Deck.MainDeck);
  const side = convertV4ListToV2(json.Deck.Sideboard);
  const deck: InternalDeck = {
    id: json.Summary.DeckId,
    name: json.Summary.Name || "",
    lastUpdated: "",
    deckTileId: json.Summary.DeckTileId,
    format: "",
    mainDeck: main,
    sideboard: side,
    commandZoneGRPIds: json.Deck.CommandZone.map((c) => c.cardId),
    companionGRPId: json.Deck.Companions.map((c) => c.cardId)[0],
    colors: new CardsList(main).getColors().getBits(),
    type: "InternalDeck",
  };

  if (deck) {
    selectDeck(new Deck(deck));
    // postChannelMessage({
    //   type: "UPSERT_DB_DECK",
    //   value: deck,
    // });
  }

  return json;
}
