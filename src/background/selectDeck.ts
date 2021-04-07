import { Deck } from "mtgatool-shared";
import globalStore from "./store";

export default function selectDeck(selectedDeck: Deck): void {
  globalStore.currentMatch = {
    ...globalStore.currentMatch,
    originalDeck: selectedDeck.clone(),
    currentDeck: selectedDeck.clone(),
  };
}
