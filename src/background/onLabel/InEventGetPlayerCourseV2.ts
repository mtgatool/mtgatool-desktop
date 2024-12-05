// import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import { PlayerCourse } from "../../types";
import LogEntry from "../../types/logDecoder";
import convertDeckFromV3 from "../../utils/convertDeckFromV3";
import selectDeck from "../selectDeck";

interface Entry extends LogEntry {
  json: PlayerCourse;
}

export default function InEventGetPlayerCourseV2(entry: Entry): void {
  const { json } = entry;
  if (!json) return;
  if (json.Id == "00000000-0000-0000-0000-000000000000") return;

  const newModule: Record<string, any> = {};
  Object.keys(json.ModuleInstanceData).forEach((k: any) => {
    const newK = k.split(".").join("");
    // @ts-ignore
    newModule[newK] = json.ModuleInstanceData[k];
  });

  if (!json.CourseDeck) return;
  // Says v2 in the label but its actually v3 !
  const deck = convertDeckFromV3(json.CourseDeck);

  if (deck) {
    selectDeck(deck);

    // postChannelMessage({
    //   type: "UPSERT_DB_DECK",
    //   value: deck.getSave(),
    // });
  }
}
