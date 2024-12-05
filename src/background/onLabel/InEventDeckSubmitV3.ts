// import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import { PlayerCourse } from "../../types";
import LogEntry from "../../types/logDecoder";
import convertDeckFromV3 from "../../utils/convertDeckFromV3";
import selectDeck from "../selectDeck";

interface Entry extends LogEntry {
  json: PlayerCourse;
}

export default function onLabelInEventDeckSubmitV3(entry: Entry): void {
  const { json } = entry;
  if (!json.CourseDeck) return;
  console.log("CourseDeck", json.CourseDeck);
  const selectedDeck = convertDeckFromV3(json.CourseDeck);

  if (selectedDeck.id == "00000000-0000-0000-0000-000000000000" && json.Id) {
    selectedDeck.id = json.Id;
  }

  selectDeck(selectedDeck);

  // postChannelMessage({
  //   type: "UPSERT_DB_DECK",
  //   value: selectedDeck.getSave(),
  // });
}
