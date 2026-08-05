/* eslint-disable camelcase */

import { CardsData } from "../../../types/collectionTypes";
import database from "../../../utils/mtga/database";

interface JsonCardData {
  name: string;
  set: string;
  collector_number: string;
  arena_grpid: number;
}

/**
 * Install the window.exportSetForScryfall console helper.
 *
 * Takes a provider rather than an array because on the SQLite path the view
 * does not hold every row — it holds one page. Pulling the whole collection
 * costs about a second, which is fine to pay when someone actually invokes
 * this from the console, and not fine to pay on every render.
 */
export default function makeExportSetForScryfallFn(
  getRows: () => Promise<CardsData[]>
) {
  (window as any).exportSetForScryfall = async (setCode: string) => {
    const jsonData: JsonCardData[] = [];
    const rows = await getRows();

    rows.forEach((c) => {
      const cardObj = database.card(c.id);

      if (
        cardObj &&
        c.setCode.includes(setCode) &&
        cardObj.Rarity !== "token"
      ) {
        const cd: JsonCardData = {
          name: cardObj.Name,
          set: cardObj.Set,
          collector_number: cardObj.CollectorNumber,
          arena_grpid: cardObj.GrpId,
        };
        jsonData.push(cd);
      }
    });

    const textData = JSON.stringify(jsonData, null, 2);

    const element = document.createElement("a");
    const file = new Blob([textData], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${setCode}.json`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };
}
