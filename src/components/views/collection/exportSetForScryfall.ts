/* eslint-disable camelcase */
import { database } from "mtgatool-shared";

import { CardsData } from "../../../types/collectionTypes";

interface JsonCardData {
  name: string;
  set: string;
  collector_number: string;
  arena_grpid: number;
}

export default function makeExportSetForScryfallFn(
  collectionData: CardsData[]
) {
  (window as any).exportSetForScryfall = (setCode: string) => {
    const jsonData: JsonCardData[] = [];
    collectionData.forEach((c) => {
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
