import { useState } from "react";
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable no-nested-ternary */
import {
  compareCards,
  DbCardData,
  Deck,
  getDeckColorsAmmount,
  getDeckLandsAmmount,
} from "mtgatool-shared";
import { PieChart } from "react-minimal-pie-chart";

import {
  DEFAULT_TILE,
  MANA_COLORS,
} from "mtgatool-shared/dist/shared/constants";
import copyToClipboard from "../../../utils/copyToClipboard";
import { getCardArtCrop } from "../../../utils/getCardArtCrop";
import getDeckRaritiesCount from "../../../utils/getDeckRaritiesCount";
import DeckColorsBar from "../../DeckColorsBar";
import SvgButton from "../../SvgButton";

import { ReactComponent as BackIcon } from "../../../assets/images/svg/back.svg";
import ManaCost from "../../ManaCost";
import Section from "../../ui/Section";
import Button from "../../ui/Button";
import Separator from "../../Separator";
import DeckTypesStats from "../../DeckTypesStats";
import DeckManaCurve from "../../DeckManaCurve";
import WildcardsCostPreset from "../../WildcardsCostPreset";
import CraftingCost from "../../CraftingCost";
import getSampleHand from "../../../utils/getSampleHand";
import CardTile from "../../CardTile";

import DeckList from "../../DeckList";

import { ExploreDeckData } from "./doExploreAggregation";
import VisualDeckView from "../decks/VisualDeckView";

// const { MANA_COLORS } = constants;

const VIEW_VISUAL = 0;
const VIEW_REGULAR = 1;

interface ExploreDeckViewProps {
  data: ExploreDeckData;
  goBack: () => void;
}

export default function ExploreDeckView(
  props: ExploreDeckViewProps
): JSX.Element {
  const { data, goBack } = props;

  const deck = new Deck({}, data.deck, []);

  const [deckView, setDeckView] = useState(VIEW_REGULAR);
  const [shuffle, setShuffle] = useState([true]);

  const visualView = (): void => {
    setDeckView(VIEW_VISUAL);
  };

  const regularView = (): void => {
    setDeckView(VIEW_REGULAR);
  };

  const traditionalShuffle = (): void => {
    setShuffle([true]);
  };

  const arenaExport = (): void => {
    deck.sortMainboard(compareCards);
    deck.sortSideboard(compareCards);
    const list = deck.getExportArena();
    copyToClipboard(list);
  };

  const colorCounts = getDeckColorsAmmount(deck);
  const colorsPie = [
    { title: "White", value: colorCounts.w, color: MANA_COLORS[0] },
    { title: "Blue", value: colorCounts.u, color: MANA_COLORS[1] },
    { title: "Black", value: colorCounts.b, color: MANA_COLORS[2] },
    { title: "Red", value: colorCounts.r, color: MANA_COLORS[3] },
    { title: "Green", value: colorCounts.g, color: MANA_COLORS[4] },
  ];
  const landCounts = getDeckLandsAmmount(deck);
  const landsPie = [
    { title: "White", value: landCounts.w, color: MANA_COLORS[0] },
    { title: "Blue", value: landCounts.u, color: MANA_COLORS[1] },
    { title: "Black", value: landCounts.b, color: MANA_COLORS[2] },
    { title: "Red", value: landCounts.r, color: MANA_COLORS[3] },
    { title: "Green", value: landCounts.g, color: MANA_COLORS[4] },
  ];

  const wildcardsCost = getDeckRaritiesCount(deck);

  return (
    <>
      <div
        className="decks-top"
        style={{
          backgroundImage: `url(${getCardArtCrop(data.tile || DEFAULT_TILE)})`,
        }}
      >
        <DeckColorsBar deck={deck} />
        <div className="top-inner">
          <div className="flex-item">
            <SvgButton
              style={{
                marginRight: "8px",
                backgroundColor: "var(--color-section)",
              }}
              svg={BackIcon}
              onClick={goBack}
            />
            <div
              style={{
                lineHeight: "32px",
                color: "var(--color-text-hover)",
                textShadow: "3px 3px 6px #000000",
              }}
            >
              {data.name}
            </div>
          </div>
          <div className="flex-item">
            <ManaCost className="mana-s20" colors={deck.getColors().get()} />
          </div>
        </div>
      </div>

      <>
        {deckView == VIEW_VISUAL && (
          <VisualDeckView deck={deck} setRegularView={regularView} />
        )}

        {deckView == VIEW_REGULAR && (
          <div className="regular-view-grid">
            <Section
              style={{
                justifyContent: "space-between",
                gridArea: "controls",
              }}
            >
              <Button
                style={{ margin: "16px" }}
                className="button-simple"
                text="Visual View"
                onClick={visualView}
              />
              <Button
                style={{ margin: "16px" }}
                className="button-simple"
                text="Export to Arena"
                onClick={arenaExport}
              />
            </Section>
            <Section
              style={{
                flexDirection: "column",
                gridArea: "deck",
                paddingBottom: "16px",
                paddingLeft: "24px",
              }}
            >
              <DeckList deck={deck} showWildcards />
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
              <Separator>Color Pie</Separator>
              <div className="pie-container-outer">
                <div className="pie-container">
                  <span>Mana Symbols</span>
                  <PieChart data={colorsPie} />
                </div>
                <div className="pie-container">
                  <span>Mana Sources</span>
                  <PieChart data={landsPie} />
                </div>
              </div>
            </Section>
            <Section style={{ flexDirection: "column", gridArea: "rarities" }}>
              <Separator>Rarities</Separator>
              <WildcardsCostPreset wildcards={wildcardsCost} showComplete />
              <Separator>Wildcards Needed</Separator>
              <CraftingCost deck={deck} />
            </Section>

            <Section
              style={{
                padding: "0 0 24px 24px",
                flexDirection: "column",
                gridArea: "hand",
              }}
            >
              <Separator>
                {shuffle[0]
                  ? "Sample Hand (Traditional)"
                  : "Sample Hand (Arena BO1)"}
              </Separator>
              <Button
                text="Shuffle"
                style={{ marginBottom: "16px" }}
                onClick={traditionalShuffle}
              />

              {shuffle[0] &&
                getSampleHand(deck)
                  .sort((a: DbCardData, b: DbCardData) => {
                    const sort = (_a: any, _b: any): number =>
                      _a > _b ? 1 : _a < _b ? -1 : 0;
                    return sort(a.cmc, b.cmc) || sort(a.name, b.name);
                  })
                  .map((c: DbCardData, index: number) => {
                    return (
                      <CardTile
                        indent="a"
                        isHighlighted={false}
                        isSideboard={false}
                        showWildcards
                        deck={deck}
                        card={c}
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                        quantity={{
                          type: "NUMBER",
                          quantity: 1,
                        }}
                      />
                    );
                  })}
            </Section>
          </div>
        )}
      </>
    </>
  );
}
