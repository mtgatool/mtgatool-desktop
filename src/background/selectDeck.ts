import Deck from "../utils/mtga/deck";
import globalStore from "./store";

export default function selectDeck(selectedDeck: Deck): void {
  globalStore.currentMatch = {
    ...globalStore.currentMatch,
    originalDeck: selectedDeck.clone(),
    currentDeck: selectedDeck.clone(),
  };
}
