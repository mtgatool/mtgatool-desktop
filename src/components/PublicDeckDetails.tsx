import { ReactNode, useState } from "react";

import compareCards from "../utils/compareCards";
import copyToClipboard from "../utils/copyToClipboard";
import Deck from "../utils/mtga/deck";
import DeckColorStats from "./DeckColorStats";
import DeckList from "./DeckList";
import DeckManaCurve from "./DeckManaCurve";
import DeckRarities from "./DeckRarities";
import DeckSampleHand from "./DeckSampleHand";
import DeckTypesStats from "./DeckTypesStats";
import Separator from "./Separator";
import Button from "./ui/Button";
import Section from "./ui/Section";
import VisualDeckView from "./views/decks/VisualDeckView";

interface PublicDeckDetailsProps {
  deck: Deck;
  /** Craft costs read the VIEWER's collection; show only where that makes sense. */
  showWildcards: boolean;
  /** Rendered on the left of the controls row (a record, usually). */
  recordSlot?: ReactNode;
}

/**
 * The public presentation of a decklist — controls row, list, types, curve,
 * colors, rarities and sample hand, with the visual-view toggle. Shared by
 * the shared-deck page and the profile deck page so the two stay the same.
 */
export default function PublicDeckDetails({
  deck,
  showWildcards,
  recordSlot,
}: PublicDeckDetailsProps): JSX.Element {
  const [visual, setVisual] = useState(false);

  const arenaExport = (): void => {
    // A clone: sorting in place would reorder the one being rendered, and a
    // rebuild from main/side would drop commanders and companions.
    const exportDeck = deck.clone();
    exportDeck.sortMainboard(compareCards);
    exportDeck.sortSideboard(compareCards);
    copyToClipboard(exportDeck.getExportArena());
  };

  if (visual) {
    return (
      <VisualDeckView deck={deck} setRegularView={() => setVisual(false)} />
    );
  }

  return (
    <div className="regular-view-grid">
      <Section
        style={{
          // With no record shown there is nothing to spread apart —
          // centered buttons instead of buttons shoved to the right.
          justifyContent: recordSlot ? "space-between" : "center",
          gridArea: "controls",
        }}
      >
        {recordSlot}
        <div style={{ display: "flex" }}>
          <Button
            style={{ margin: "16px" }}
            className="button-simple"
            text="Visual View"
            onClick={() => setVisual(true)}
          />
          <Button
            style={{ margin: "16px" }}
            className="button-simple"
            text="Export to Arena"
            onClick={arenaExport}
          />
        </div>
      </Section>
      <Section
        style={{
          flexDirection: "column",
          gridArea: "deck",
          paddingBottom: "16px",
          paddingLeft: "24px",
        }}
      >
        <DeckList deck={deck} showWildcards={showWildcards} />
      </Section>
      <Section style={{ flexDirection: "column", gridArea: "types" }}>
        <Separator>Types</Separator>
        <DeckTypesStats deck={deck} />
      </Section>
      <Section style={{ flexDirection: "column", gridArea: "curves" }}>
        <Separator>Mana Curve</Separator>
        <DeckManaCurve deck={deck} />
      </Section>
      <Section style={{ flexDirection: "column", gridArea: "pies" }}>
        <Separator>Colors</Separator>
        <DeckColorStats deck={deck} />
      </Section>
      <Section style={{ flexDirection: "column", gridArea: "rarities" }}>
        <Separator>Cards by rarity</Separator>
        <DeckRarities deck={deck} />
      </Section>
      <Section style={{ flexDirection: "column", gridArea: "hand" }}>
        <Separator>Sample hand</Separator>
        <DeckSampleHand deck={deck} />
      </Section>
    </div>
  );
}
