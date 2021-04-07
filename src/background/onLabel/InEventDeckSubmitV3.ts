import { convertDeckFromV3, PlayerCourse } from "mtgatool-shared";
import LogEntry from "../../types/logDecoder";
import selectDeck from "../selectDeck";

interface Entry extends LogEntry {
  json: PlayerCourse;
}

export default function onLabelInEventDeckSubmitV3(entry: Entry): void {
  const { json } = entry;
  if (!json.CourseDeck) return;

  const selectedDeck = convertDeckFromV3(json.CourseDeck);
  selectDeck(selectedDeck);
}
