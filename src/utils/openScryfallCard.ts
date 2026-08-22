import { DbCardDataV2 } from "../types";
import findSetByCode from "./findSetByCode";
import database from "./mtga/database";
import openExternal from "./openExternal";

export default function openScryfallCard(card?: DbCardDataV2 | number): void {
  const cardObj = typeof card == "number" ? database.card(card) : card;

  if (!cardObj) {
    console.error(`Cant open scryfall card: ${cardObj}`);
    return;
  }

  // The metadata build already resolved where this card lives on Scryfall, and
  // that is the only address worth linking to. Arena's own (Set,
  // CollectorNumber) is not an address into Scryfall — the same mismatch
  // getCardArtCrop works around for images: Arena's Y23-BRO/12 is Knight of
  // the Ebon Legion, Scryfall's ybro/12 is Argothian Uprooting. Art.s already
  // carries the `t` prefix for token sets, so IsToken must not be re-applied.
  const { Art } = cardObj;
  if (Art?.s && Art?.n) {
    openExternal(`https://scryfall.com/card/${Art.s}/${Art.n}`);
    return;
  }

  // Cards the build could not place, and databases predating art resolution.
  const { CollectorNumber, Set } = cardObj;
  const token = cardObj.IsToken ? "t" : "";

  const setObj = findSetByCode(Set);

  if (setObj) {
    openExternal(
      `https://scryfall.com/card/${token}${setObj.scryfall}/${CollectorNumber}`
    );
  }
}
