/* eslint-disable no-restricted-globals */

import getCollectionData from "./getCollectionData";

/*
  Im wrapping up this into a web worker for performance.
  This is a loop that will only get worse and worse as more cards and formats are added to MTGA,
  Therefore I am isolating its execution in another "thread", to avoid it blocking
  React from rendering and causing lots of blocks in the UI.
  Ideally some other things like Automerge should be in a separate thread, but that
  requires isolating ToolDb as well.
*/
self.onmessage = (e: any) => {
  const { cards, cardsList, allCards, setNames, sets } = e.data;

  const cardsData = getCollectionData(
    cards,
    cardsList,
    allCards,
    setNames,
    sets
  );

  self.postMessage(cardsData);
};
