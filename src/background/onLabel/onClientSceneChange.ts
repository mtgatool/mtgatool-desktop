import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import readCards from "../../reader/readCards";
import readDecks from "../../reader/readDecks";
import LogEntry, { ClientSceneChange } from "../../types/logDecoder";
import { isLiveLog } from "../logReadState";

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

  // Native memory reads only make sense while tailing the live log — during the
  // startup catch-up they read current memory (irrelevant to a past scene
  // change) and, being synchronous, freeze the UI across many replayed entries.
  // A single post-catch-up refresh (see worker.ts) covers current state.
  if (isLiveLog()) {
    if (json.fromSceneName === "BoosterChamber") {
      readCards();
    }

    // Saved decks can only be read from memory outside a match (the reader
    // errors during a game). Refresh them when leaving the deck builder (just
    // edited) or when landing back on Home.
    if (json.fromSceneName === "DeckBuilder" || json.toSceneName === "Home") {
      readDecks();
    }
  }

  postChannelMessage({
    type: "SET_SCENE",
    value: json,
  });
}
