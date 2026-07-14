import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import readCards from "../../reader/readCards";
import readDecks from "../../reader/readDecks";
import LogEntry, { ClientSceneChange } from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: ClientSceneChange;
}

export default function onClientSceneChange(entry: Entry): void {
  const { json } = entry;

  if (json.fromSceneName === "Draft") {
    postChannelMessage({
      type: "DRAFT_END",
    });
  }

  if (json.fromSceneName === "BoosterChamber") {
    readCards();
  }

  // Saved decks can only be read from memory outside a match (the reader errors
  // during a game). Refresh them when leaving the deck builder (just edited) or
  // when landing back on Home.
  if (json.fromSceneName === "DeckBuilder" || json.toSceneName === "Home") {
    readDecks();
  }

  postChannelMessage({
    type: "SET_SCENE",
    value: json,
  });
}
