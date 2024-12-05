import { JumpstartThemes } from "../types/jumpstart";
import Deck from "./mtga/deck";

export const themeCards: Record<JumpstartThemes, number> = {
  Basri: 74641,
  Unicorns: 72561,
  Teferi: 74642,
  Mill: 72570,
  Liliana: 74643,
  Phyrexian: 72578,
  Chandra: 74644,
  Seismic: 72584,
  Garruk: 74645,
  Walls: 72595,
  Rainbow: 72598,
  Angels: 72560,
  Dogs: 72565,
  Enchanted: 72562,
  Pirates: 72572,
  Spirits: 72571,
  "Under the Sea": 72566,
  Discarding: 72575,
  Rogues: 72577,
  Witchcraft: 72579,
  Dragons: 72582,
  Lightning: 72588,
  Minotaurs: 72589,
  Cats: 72594,
  Elves: 72597,
  Lands: 72591,
  Doctor: 72559,
  "Feathered Friends": 72564,
  "Heavily Armored": 72563,
  Legion: 72558,
  "Above the Clouds": 72568,
  Archaeology: 72569,
  "Well-Read": 72573,
  Wizards: 72567,
  Minions: 72574,
  Reanimated: 72576,
  Spooky: 72581,
  Vampires: 72580,
  Devilish: 72583,
  Goblins: 72585,
  Smashing: 72587,
  Spellcasting: 72586,
  Dinosaurs: 72593,
  "Plus One": 72592,
  Predatory: 72596,
  "Tree-Hugging": 72590,
};

export default function getJumpstartThemes(deck: Deck): JumpstartThemes[] {
  deck.getMainboard().removeDuplicates(true);
  deck.getSideboard().removeDuplicates(true);
  deck.getMainboard().removeZeros(true);
  deck.getSideboard().removeZeros(true);
  const deckString = deck.getUniqueString();

  const themes: JumpstartThemes[] = [];

  Object.keys(themeCards).forEach((key) => {
    const theme = key as JumpstartThemes;
    if (deckString.indexOf(`${themeCards[theme]}`) !== -1) {
      themes.push(theme);
    }
  });
  return themes.sort();
}
