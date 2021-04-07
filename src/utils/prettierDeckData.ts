import { InternalDeck } from "mtgatool-shared";

export default function prettierDeckData(data: InternalDeck): InternalDeck {
  const deckData = { ...data };
  // many precon descriptions are total garbage
  // manually update them with generic descriptions
  const prettyDescriptions: Record<string, string> = {
    "Decks/Precon/Precon_EPP_BG_Desc": "Golgari Swarm",
    "Decks/Precon/Precon_EPP_BR_Desc": "Cult of Rakdos",
    "Decks/Precon/Precon_EPP_GU_Desc": "Simic Combine",
    "Decks/Precon/Precon_EPP_GW_Desc": "Selesnya Conclave",
    "Decks/Precon/Precon_EPP_RG_Desc": "Gruul Clans",
    "Decks/Precon/Precon_EPP_RW_Desc": "Boros Legion",
    "Decks/Precon/Precon_EPP_UB_Desc": "House Dimir",
    "Decks/Precon/Precon_EPP_UR_Desc": "Izzet League",
    "Decks/Precon/Precon_EPP_WB_Desc": "Orzhov Syndicate",
    "Decks/Precon/Precon_EPP_WU_Desc": "Azorius Senate",
    "Decks/Precon/Precon_July_B": "Out for Blood",
    "Decks/Precon/Precon_July_U": "Azure Skies",
    "Decks/Precon/Precon_July_G": "Forest's Might",
    "Decks/Precon/Precon_July_R": "Dome Destruction",
    "Decks/Precon/Precon_July_W": "Angelic Army",
    "Decks/Precon/Precon_Brawl_Alela": "Alela, Artful Provocateur",
    "Decks/Precon/Precon_Brawl_Chulane": "Chulane, Teller of Tales",
    "Decks/Precon/Precon_Brawl_Korvold": "Korvold, Fae-Cursed King",
    "Decks/Precon/Precon_Brawl_SyrGwyn": "Syr Gwyn, Hero of Ashvale",
  };
  if (deckData.description in prettyDescriptions) {
    deckData.description = prettyDescriptions[deckData.description];
  }
  if (deckData.name.includes("?=?Loc")) {
    // precon deck names are garbage address locators
    // mask them with description instead
    deckData.name = deckData.description || "Preconstructed Deck";
  }
  return deckData;
}
