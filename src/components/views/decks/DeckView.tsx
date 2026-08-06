/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable no-nested-ternary */

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useParams } from "react-router-dom";

import { ReactComponent as BackIcon } from "../../../assets/images/svg/back.svg";
import { ReactComponent as CameraIcon } from "../../../assets/images/svg/camera-solid.svg";
import { DEFAULT_TILE } from "../../../constants";
import { useCardArtCrop } from "../../../hooks/useCardImage";
import useSavedDecks from "../../../hooks/useSavedDecks";
import reduxAction from "../../../redux/reduxAction";
import { AppState } from "../../../redux/stores/rendererStore";
import { CardObject } from "../../../types";
import { StatsDeck } from "../../../types/dbTypes";
import compareCards from "../../../utils/compareCards";
import copyToClipboard from "../../../utils/copyToClipboard";
import Colors from "../../../utils/mtga/colors";
import Deck from "../../../utils/mtga/deck";
import savedDeckToStatsDeck from "../../../utils/mtga/savedDeckToStatsDeck";
import CraftingCost from "../../CraftingCost";
import DeckColorsBar from "../../DeckColorsBar";
import DeckColorStats from "../../DeckColorStats";
import DeckList from "../../DeckList";
import DeckManaCurve from "../../DeckManaCurve";
import DeckRarities from "../../DeckRarities";
import DeckSampleHand from "../../DeckSampleHand";
import DeckTypesStats from "../../DeckTypesStats";
import ManaCost from "../../ManaCost";
import Separator from "../../Separator";
import SvgButton from "../../SvgButton";
import Button from "../../ui/Button";
import Section from "../../ui/Section";
import CardsWinratesView from "./CardsWinrateView";
import ChangesDeckView from "./ChangesDeckView";
import VisualDeckView from "./VisualDeckView";

// const { MANA_COLORS } = constants;

const VIEW_VISUAL = 0;
const VIEW_REGULAR = 1;
const VIEW_CHANGES = 2;
const VIEW_WINRATES = 3;

interface DeckViewProps {
  openDeckView: (deck: Deck) => void;
}

export default function DeckView(props: DeckViewProps): JSX.Element {
  const { openDeckView } = props;

  const dispatch = useDispatch();
  const history = useHistory();
  const params = useParams<{ page: string; id: string }>();

  const [dbDeck, setDbDeck] = useState<StatsDeck>();
  const deckArt = useCardArtCrop(dbDeck?.deckTileId || DEFAULT_TILE);
  // A played deck has match history (deck changes + card winrates). Saved decks
  // read from memory that were never played have neither.
  const [isPlayed, setIsPlayed] = useState(false);

  const fullStats = useSelector((state: AppState) => state.mainData.fullStats);
  const savedDecks = useSavedDecks();

  useEffect(() => {
    const hashes = fullStats?.decks[params.id];
    if (fullStats && hashes) {
      let latestTimestamp = fullStats.deckIndex[hashes[0]].lastUsed;
      let latestHash = hashes[0];

      hashes.forEach((h) => {
        if (latestTimestamp < fullStats.deckIndex[h].lastUsed) {
          latestTimestamp = fullStats.deckIndex[h].lastUsed;
          latestHash = h;
        }
      });
      setDbDeck(fullStats.deckIndex[latestHash]);
      setIsPlayed(true);
      return;
    }

    // Not a played deck — fall back to a saved deck read from memory. Same
    // view, just no match history / winrates.
    const saved = savedDecks.find((d) => d.deckId === params.id);
    if (saved) {
      setDbDeck(savedDeckToStatsDeck(saved));
      setIsPlayed(false);
    }
  }, [fullStats, params, savedDecks]);

  const deck = new Deck(
    {
      commandZoneGRPIds: dbDeck?.commanders
        ? dbDeck.commanders.map((c: CardObject) => c.id)
        : undefined,
      companionGRPId: dbDeck?.companions
        ? dbDeck.companions.map((c: CardObject) => c.id)[0]
        : undefined,
    },
    dbDeck?.mainDeck || [],
    dbDeck?.sideboard || []
  );

  deck.setName(dbDeck?.name || "Deck");
  deck.tile = dbDeck?.deckTileId || DEFAULT_TILE;

  const [deckView, setDeckView] = useState(VIEW_REGULAR);

  const deckWinratesView = (): void => {
    setDeckView(VIEW_WINRATES);
  };

  const deckChangesView = (): void => {
    setDeckView(VIEW_CHANGES);
  };

  const visualView = (): void => {
    setDeckView(VIEW_VISUAL);
  };

  const regularView = (): void => {
    setDeckView(VIEW_REGULAR);
  };

  useEffect(() => {
    setDeckView(VIEW_REGULAR);
  }, [dbDeck]);

  const arenaExport = (): void => {
    deck.sortMainboard(compareCards);
    deck.sortSideboard(compareCards);
    const list = deck.getExportArena();
    copyToClipboard(list);
    reduxAction(dispatch, {
      type: "SET_POPUP",
      arg: {
        text: "Deck copied to clipboard.",
        duration: 5000,
        time: new Date().getTime(),
      },
    });
  };

  return (
    <>
      <div
        className="decks-top"
        style={{
          backgroundImage: dbDeck ? `url(${deckArt})` : "",
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
              onClick={() => {
                history.push("/decks");
                reduxAction(dispatch, {
                  type: "SET_BACK_GRPID",
                  arg: null,
                });
              }}
            />
            <div
              style={{
                lineHeight: "32px",
                color: "var(--color-text-hover)",
                textShadow: "3px 3px 6px #000000",
              }}
            >
              {dbDeck?.name}
            </div>
          </div>
          <div className="flex-item">
            <ManaCost
              className="mana-s20"
              colors={new Colors().addFromBits(dbDeck?.colors || 0).get()}
            />
          </div>
        </div>
      </div>

      <>
        {deckView == VIEW_VISUAL && (
          <VisualDeckView deck={deck} setRegularView={regularView} />
        )}
        {deckView == VIEW_CHANGES && isPlayed && (
          <ChangesDeckView setRegularView={regularView} />
        )}
        {deckView == VIEW_WINRATES && isPlayed && dbDeck && fullStats && (
          <CardsWinratesView
            fullStats={fullStats}
            dbDeck={dbDeck}
            setRegularView={regularView}
          />
        )}
        {deckView == VIEW_REGULAR && (
          <div className="regular-view-grid">
            <Section
              style={{
                justifyContent: "space-between",
                gridArea: "controls",
              }}
            >
              <SvgButton
                svg={CameraIcon}
                style={{ height: "32px", width: "32px", margin: "auto 16px" }}
                onClick={() => openDeckView(deck)}
              />
              {isPlayed && (
                <Button
                  style={{ margin: "16px" }}
                  className="button-simple"
                  text="Deck Changes"
                  onClick={deckChangesView}
                />
              )}
              {isPlayed && (
                <Button
                  style={{ margin: "16px" }}
                  className="button-simple"
                  text="Card Winrates"
                  onClick={deckWinratesView}
                />
              )}
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
              <Separator>Colors</Separator>
              <DeckColorStats deck={deck} />
            </Section>
            <Section style={{ flexDirection: "column", gridArea: "rarities" }}>
              <Separator>Cards by rarity</Separator>
              <DeckRarities deck={deck} />
              <Separator>Wildcards to build it</Separator>
              <CraftingCost deck={deck} />
            </Section>

            <Section style={{ flexDirection: "column", gridArea: "hand" }}>
              <Separator>Sample hand</Separator>
              <DeckSampleHand deck={deck} />
            </Section>
          </div>
        )}
      </>
    </>
  );
}
