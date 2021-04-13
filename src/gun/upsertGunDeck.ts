import { Deck, InternalDeck } from "mtgatool-shared";
import { GunDeck } from "../types/gunTypes";
import getLocalSetting from "../utils/getLocalSetting";
import getGraphKeys from "./getGraphKeys";
import getGunUser from "./getGunUser";

export default async function upsertGunDeck(internal: InternalDeck) {
  const deck = new Deck(internal);
  const userRef = getGunUser();
  if (userRef) {
    const decksIndexRef = userRef.get("decksIndex");
    const decksRef = userRef.get("decks");
    const indexKeys = await getGraphKeys(decksIndexRef);

    let existsInDb = false;
    let version = 0;
    if (indexKeys.includes(deck.id)) {
      existsInDb = true;
      const deckIdRef = decksIndexRef.get(deck.id);
      version = deckIdRef.then ? await deckIdRef.then() : 0;
    }

    const currentDeckKey = `${deck.id}-v${version}`;
    const currentDeckHash: string = await (decksRef as any)
      .get(currentDeckKey)
      .get("deckHash")
      .then();

    const newGunDeck: GunDeck = {
      playerId: getLocalSetting("playerId"),
      name: deck.getName(),
      version: version,
      deckHash: deck.getHash(),
      deckId: deck.id,
      colors: deck.colors.getBits(),
      tile: deck.tile,
      format: deck.format,
      internalDeck: JSON.stringify(deck.getSave()),
      matches: {},
      stats: {
        gameWins: 0,
        gameLosses: 0,
        matchWins: 0,
        matchLosses: 0,
      },
    };

    if (!existsInDb) {
      decksRef.get(currentDeckKey).put(newGunDeck);
      decksIndexRef.get(deck.id).put(version);
    } else if (currentDeckHash !== deck.getHash()) {
      // this is a new deck, update the version
      version += 1;
      newGunDeck.version = version;
      const newDeckDeckKey = `${deck.id}-v${version}`;

      decksRef.get(newDeckDeckKey).put(newGunDeck);
      decksIndexRef.get(deck.id).put(version);
    } else {
      decksRef.get(currentDeckKey).put(newGunDeck);
    }
  }
  return true;
}
