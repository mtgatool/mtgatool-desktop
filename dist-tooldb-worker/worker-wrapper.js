"use strict";
var _a;
workerRef.current.postMessage({
    cards: ((_a = uuidData[currentUUID]) === null || _a === void 0 ? void 0 : _a.cards) || defaultCardsData,
    cardsList: database.cardList,
    allCards: database.cards,
    setNames: database.setNames,
    sets: database.sets,
});
