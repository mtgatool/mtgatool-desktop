/* eslint-disable react/no-array-index-key */
/* eslint-disable radix */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable no-nested-ternary */
import { useState } from "react";
import {
  compareCards,
  database,
  DbCardDataV2,
  Deck,
  getDeckColorsAmmount,
  getDeckLandsAmmount,
} from "mtgatool-shared";
import { PieChart } from "react-minimal-pie-chart";

import {
  DEFAULT_TILE,
  MANA_COLORS,
} from "mtgatool-shared/dist/shared/constants";
import { useDispatch } from "react-redux";
import copyToClipboard from "../../../utils/copyToClipboard";
import { getCardArtCrop, getCardImage } from "../../../utils/getCardArtCrop";
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
import getWinrateClass from "../../../utils/getWinrateClass";
import reduxAction from "../../../redux/reduxAction";
import Flex from "../../Flex";
import { toMMSS } from "../../../utils/dateTo";

// const { MANA_COLORS } = constants;

interface CardsListComponentProps {
  key: string;
  cards: number[];
}

function CardsListComponent(props: CardsListComponentProps) {
  const { key, cards } = props;

  const dispatch = useDispatch();

  const hoverCard = (id: number, hover: boolean): void => {
    reduxAction(dispatch, {
      type: hover ? "SET_HOVER_IN" : "SET_HOVER_OUT",
      arg: { grpId: id },
    });
  };

  return (
    <div
      className="card-lists-list"
      style={{ marginBottom: "4px", marginLeft: "auto" }}
    >
      {cards.map((grpId, ind) => {
        const cardObj = database.card(grpId);
        if (cardObj) {
          return (
            <img
              key={`${key}-cards-${grpId}-${ind}`}
              onMouseEnter={(): void => {
                hoverCard(grpId, true);
              }}
              onMouseLeave={(): void => {
                hoverCard(grpId, false);
              }}
              style={{
                height: `80px`,
              }}
              src={getCardImage(cardObj, "normal")}
              className="mulligan-card-img"
            />
          );
        }
        return <></>;
      })}
    </div>
  );
}

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

  const deck = new Deck({}, data.deck || [], data.side || []);

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

  const winrate = Math.round((100 / (data.wins + data.losses)) * data.wins);
  const gamesWinrate = Math.round(
    (100 / (data.gWins + data.gLosses)) * data.gWins
  );

  return (
    <>
      <div
        className="decks-top"
        style={{
          marginTop: "0px",
          backgroundImage: data
            ? `url(${getCardArtCrop(data.tile || DEFAULT_TILE)})`
            : "",
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
          <div className="explore-deck-view-grid">
            <Section
              style={{
                justifyContent: "space-between",
                gridArea: "controls",
              }}
            >
              <Button
                className="button-simple"
                text="Visual View"
                onClick={visualView}
              />
              <Button
                className="button-simple"
                text="Export to Arena"
                onClick={arenaExport}
              />
            </Section>
            <Section
              style={{ flexDirection: "column", gridArea: "stats-deck" }}
            >
              <Flex style={{ marginBottom: "8px" }}>
                <i>Winrate:</i>
                <div style={{ marginLeft: "auto" }}>
                  {data.wins}:{data.losses}
                </div>
                <div
                  style={{ marginLeft: "4px" }}
                  className={getWinrateClass(winrate, true)}
                >
                  ({winrate}%)
                </div>
              </Flex>
              <Flex style={{ marginBottom: "8px" }}>
                <i>Games Winrate:</i>
                <div style={{ marginLeft: "auto" }}>
                  {data.gWins}:{data.gLosses}
                </div>
                <div
                  style={{ marginLeft: "4px" }}
                  className={getWinrateClass(gamesWinrate, true)}
                >
                  ({gamesWinrate}%)
                </div>
              </Flex>
              <Flex style={{ marginBottom: "8px" }}>
                <i>Average duration:</i>
                <div style={{ marginLeft: "auto" }}>
                  {toMMSS(Math.round(data.avgDuration))}
                </div>
              </Flex>
            </Section>
            <Section
              style={{
                gridArea: "stats-cards",
                flexDirection: "column",
              }}
            >
              <Flex>
                <div style={{ lineHeight: "80px" }}>Best Cards: </div>
                <CardsListComponent
                  key="best-cards"
                  cards={Object.keys(data.bestCards).map((id) => parseInt(id))}
                />
              </Flex>
              <Flex>
                <div style={{ lineHeight: "80px" }}>Bad Matchup cards: </div>
                <CardsListComponent
                  key="worst-matchups"
                  cards={Object.keys(data.worstMatchCards).map((id) =>
                    parseInt(id)
                  )}
                />
              </Flex>
              <Flex>
                <div style={{ lineHeight: "80px" }}>Good against: </div>
                <CardsListComponent
                  key="best-matchups"
                  cards={Object.keys(data.bestMatchCards).map((id) =>
                    parseInt(id)
                  )}
                />
              </Flex>
            </Section>
            <Section
              style={{
                flexDirection: "column",
                gridArea: "deck",
                paddingBottom: "16px",

                marginBottom: "16px",
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
                marginBottom: "16px",
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
                  .sort((a: DbCardDataV2, b: DbCardDataV2) => {
                    const sort = (_a: any, _b: any): number =>
                      _a > _b ? 1 : _a < _b ? -1 : 0;
                    return sort(a.Cmc, b.Cmc) || sort(a.Name, b.Name);
                  })
                  .map((c: DbCardDataV2, index: number) => {
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
