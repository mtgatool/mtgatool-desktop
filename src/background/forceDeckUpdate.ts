import { CardObject, Chances } from "mtgatool-shared";

import { hypergeometricRange } from "../utils/statsFns";
import globalStore from "./store";
import { setCardsOdds } from "./store/currentMatchStore";

function chanceType(
  quantity: number,
  cardsleft: number,
  oddsSampleSize: number
): number {
  return (
    Math.round(
      hypergeometricRange(
        1,
        Math.min(oddsSampleSize, quantity),
        cardsleft,
        oddsSampleSize,
        quantity
      ) * 1000
    ) / 10
  );
}

const forceDeckUpdate = (removeUsed = true): void => {
  let decksize = 0;
  let cardsleft = 0;
  let typeCre = 0;
  let typeIns = 0;
  let typeSor = 0;
  let typePla = 0;
  let typeArt = 0;
  let typeEnc = 0;
  let typeLan = 0;
  const { currentMatch } = globalStore;
  const playerCardsUsed = currentMatch.player.cardsUsed;
  const playerCardsBottom = currentMatch.cardsBottom;
  const playerCardsFromSide = currentMatch.cardsFromSideboard;
  const playerCardsLeft = globalStore.currentMatch.currentDeck.clone();

  const oddsSampleSize = 1;

  // Remove cards that came from the sideboard from the list of
  // cards used to remove from the mainboard.
  playerCardsFromSide.forEach((grpId) => {
    playerCardsUsed.splice(playerCardsUsed.indexOf(grpId) + 1, 1);
  });

  playerCardsLeft
    .getMainboard()
    .get()
    .forEach((card: CardObject) => {
      // card.total = card.quantity;
      if (card && card.quantity) {
        decksize += card.quantity;
        cardsleft += card.quantity;
      }
    });

  if (removeUsed) {
    cardsleft -= playerCardsUsed.length;
    playerCardsUsed.forEach((grpId: number) => {
      playerCardsLeft.getMainboard().remove(grpId, 1);
    });
    playerCardsFromSide.forEach((grpId: number) => {
      playerCardsLeft.getSideboard().remove(grpId, 1);
    });
  }
  // Remove cards that were put on the bottom
  playerCardsBottom.forEach((grpId: number) => {
    playerCardsLeft.getMainboard().remove(grpId, 1);
  });

  cardsleft = Math.max(cardsleft - playerCardsBottom.length, 0);

  if (cardsleft < oddsSampleSize) cardsleft = oddsSampleSize;

  const main = playerCardsLeft.getMainboard();
  main.removeDuplicates();
  main.addChance((card: CardObject) =>
    Math.round(
      hypergeometricRange(
        1,
        Math.min(oddsSampleSize, card.quantity),
        cardsleft,
        oddsSampleSize,
        card.quantity || 0
      ) * 100
    )
  );

  typeLan = main.countType("Land");
  typeCre = main.countType("Creature");
  typeArt = main.countType("Artifact");
  typeEnc = main.countType("Enchantment");
  typeIns = main.countType("Instant");
  typeSor = main.countType("Sorcery");
  typePla = main.countType("Planeswalker");

  const chancesObj: Chances = new Chances();
  chancesObj.sampleSize = oddsSampleSize;

  const landsCount = main.getLandsAmounts();
  chancesObj.landW = chanceType(landsCount.w, cardsleft, oddsSampleSize);
  chancesObj.landU = chanceType(landsCount.u, cardsleft, oddsSampleSize);
  chancesObj.landB = chanceType(landsCount.b, cardsleft, oddsSampleSize);
  chancesObj.landR = chanceType(landsCount.r, cardsleft, oddsSampleSize);
  chancesObj.landG = chanceType(landsCount.g, cardsleft, oddsSampleSize);

  chancesObj.chanceCre = chanceType(typeCre, cardsleft, oddsSampleSize);
  chancesObj.chanceIns = chanceType(typeIns, cardsleft, oddsSampleSize);
  chancesObj.chanceSor = chanceType(typeSor, cardsleft, oddsSampleSize);
  chancesObj.chancePla = chanceType(typePla, cardsleft, oddsSampleSize);
  chancesObj.chanceArt = chanceType(typeArt, cardsleft, oddsSampleSize);
  chancesObj.chanceEnc = chanceType(typeEnc, cardsleft, oddsSampleSize);
  chancesObj.chanceLan = chanceType(typeLan, cardsleft, oddsSampleSize);

  chancesObj.deckSize = decksize;
  chancesObj.cardsLeft = cardsleft;
  setCardsOdds(chancesObj);

  // Add that that were put on the bottom again, so it
  // doesnt affect the display of the decklist
  playerCardsBottom.forEach((grpId: number) => {
    playerCardsLeft.getMainboard().add(grpId, 1);
  });
  cardsleft += playerCardsBottom.length;

  globalStore.currentMatch.cardsLeft = playerCardsLeft;
};

export default forceDeckUpdate;
