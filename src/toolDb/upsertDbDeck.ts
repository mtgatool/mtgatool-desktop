import { Deck, InternalDeck } from "mtgatool-shared";
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";

import { DbDeck } from "../types/dbTypes";
import getLocalSetting from "../utils/getLocalSetting";
import objToBase from "../utils/objToBase";

let upsertDecksIndexTimeout: NodeJS.Timeout | undefined;

export default async function upsertDb(internal: InternalDeck) {
  const deck = new Deck(internal);

  const { decksIndex } = store.getState().mainData;
  const { dispatch } = store;

  console.log("DecksIndex", decksIndex);

  let existsInDb = false;
  let version = 0;

  if (Object.keys(decksIndex).includes(deck.id)) {
    existsInDb = true;
    version = decksIndex[deck.id] || 0;
  }

  const newDbDeck: DbDeck = {
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

    reduxAction(dispatch, {
      type: "SET_DECKS_INDEX",
      arg: {
        ...decksIndex,
        [deck.id]: version,
      },
    });

    window.toolDb.putData<DbDeck>(`decks-${currentDeckKey}`, newDbDeck, true);
  } else {
    window.toolDb
      .getData<DbDeck>(`decks-${currentDeckKey}`, true)
      .then((currentDeck) => {
        if (!currentDeck.deckHash) return;

        console.log(currentDeckKey);
        console.log(currentDeck);
        console.log(currentDeck.deckHash, deck.getHash());

        if (currentDeck.deckHash !== deck.getHash()) {
          console.log(`${deck.id} bump version to ${version + 1}`);
          // this is a new deck, update the version
          version += 1;
          newDbDeck.version = version;
          const newDeckDeckKey = `${deck.id}-v${version}`;

          window.toolDb.putData<DbDeck>(
            `decks-${newDeckDeckKey}`,
            newDbDeck,
            true
          );

          reduxAction(dispatch, {
            type: "SET_DECKS_INDEX",
            arg: {
              ...decksIndex,
              [deck.id]: version,
            },
          });

          // decksRef.get(newDeckDeckKey).put(newDbDeck);
          // decksIndexRef.get(deck.id).put(version);
        } else {
          console.log(`${deck.id} up to date! `);
          // decksRef.get(currentDeckKey).put(newDbDeck);
        }
      });
  }

  if (upsertDecksIndexTimeout) clearTimeout(upsertDecksIndexTimeout);
  upsertDecksIndexTimeout = setTimeout(() => {
    const newDecksIndex = store.getState().mainData.decksIndex;
    window.toolDb.putData<Record<string, number>>(
      "decksIndex",
      newDecksIndex,
      true
    );
  }, 1500);
}
