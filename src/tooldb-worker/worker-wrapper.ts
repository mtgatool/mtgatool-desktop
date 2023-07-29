workerRef.current.postMessage({
  cards: uuidData[currentUUID]?.cards || defaultCardsData,
  cardsList: database.cardList,
  allCards: database.cards,
  setNames: database.setNames,
  sets: database.sets,
});
