import { convertDeckFromV3, PlayerCourse } from "mtgatool-shared";
import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";
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

  postChannelMessage({
    type: "UPSERT_DB_DECK",
    value: selectedDeck.getSave(),
  });
}
