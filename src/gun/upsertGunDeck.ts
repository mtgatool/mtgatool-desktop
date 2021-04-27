import { Deck, InternalDeck } from "mtgatool-shared";
import { GunDeck } from "../types/gunTypes";
import getLocalSetting from "../utils/getLocalSetting";
import objToBase from "../utils/objToBase";
import getGunUser from "./getGunUser";

export default async function upsertGunDeck(internal: InternalDeck) {
  console.log(internal);
  const deck = new Deck(internal);
  const userRef = getGunUser();
  console.log("> Upsert deck: ", deck);
  if (userRef) {
    const decksIndexRef = userRef.get("decksIndex");
    const decksRef = userRef.get("decks");
    const indexKeys = await decksIndexRef.then();

    let existsInDb = false;
    let version = 0;
    // console.log(indexKeys, deck.id);
    if (Object.keys(indexKeys || {}).includes(deck.id)) {
      existsInDb = true;
      const decksIndex = await decksIndexRef.then();
      version = decksIndex[deck.id] || 0;
    }

    const newGunDeck: GunDeck = {
      playerId: getLocalSetting("playerId"),
      name: deck.getName(),
      version: version,
      deckHash: deck.getHash(),
      deckId: deck.id,
      colors: deck.colors.getBits(),
      tile: deck.tile,
      format: deck.format,
      internalDeck: objToBase(deck.getSave()),
      lastUsed: 0,
      lastModified: new Date().getTime(),
      matches: {},
      stats: {
        gameWins: 0,
        gameLosses: 0,
        matchWins: 0,
        matchLosses: 0,
      },
    };

    const currentDeckKey = `${deck.id}-v${version}`;

    if (!existsInDb) {
      console.log(`Putting ${deck.id} to db`);
      decksRef.get(currentDeckKey).put(newGunDeck);
      decksIndexRef.get(deck.id).put(version);
    } else {
      (decksRef as any)
        .get(currentDeckKey)
        .on((currentDeck: GunDeck, k: string, a: any, ev: any) => {
          if (!currentDeck.deckHash) return;
          ev.off();
          console.log(currentDeckKey);
          console.log("Exists? ", existsInDb);
          console.log(currentDeck);
          console.log(currentDeck.deckHash, deck.getHash());

          if (currentDeck.deckHash !== deck.getHash()) {
            console.log(`${deck.id} bump version to ${version + 1}`);
            // this is a new deck, update the version
            version += 1;
            newGunDeck.version = version;
            const newDeckDeckKey = `${deck.id}-v${version}`;

            decksRef.get(newDeckDeckKey).put(newGunDeck);
            decksIndexRef.get(deck.id).put(version);
          } else {
            console.log(`${deck.id} up to date! `);
            // decksRef.get(currentDeckKey).put(newGunDeck);
          }
        });
    }
  }
  return true;
}
