import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory, useParams } from "react-router-dom";

import { DEFAULT_TILE } from "../../../constants";
import fetchExploreDecks, {
  ExploreDeckRow as Row,
} from "../../../data/fetchExploreDecks";
import useCardDatabaseVersion from "../../../hooks/useCardDatabaseVersion";
import reduxAction from "../../../redux/reduxAction";
import compareCards from "../../../utils/compareCards";
import copyToClipboard from "../../../utils/copyToClipboard";
import {
  averageDecklist,
  clusterBySimilarity,
  deckVector,
} from "../../../utils/deckSimilarity";
import { getCardArtCrop } from "../../../utils/getCardArtCrop";
import getEventPrettyName from "../../../utils/getEventPrettyName";
import Deck from "../../../utils/mtga/deck";
import DeckColorsBar from "../../DeckColorsBar";
import DeckList from "../../DeckList";
import ManaCost from "../../ManaCost";
import Button from "../../ui/Button";
import Section from "../../ui/Section";

const AVERAGE = -1;

export default function ViewExploreDeck(): JSX.Element {
  const { id, hash } = useParams<{ id: string; hash: string }>();
  const history = useHistory();
  const dispatch = useDispatch();
  const dbVersion = useCardDatabaseVersion();

  const [rows, setRows] = useState<Row[] | null>(null);
  const [selected, setSelected] = useState<number>(AVERAGE);

  useEffect(() => {
    let alive = true;
    fetchExploreDecks(id).then((r) => {
      if (alive) setRows(r);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  // The event view clusters for display only; the grouping is recomputed here
  // from the same inputs so a deep link works without carrying state across.
  const versions = useMemo(() => {
    const all = rows || [];
    if (!dbVersion || !all.length) return [];
    const vectors = all.map((row) => deckVector(row.deck?.mainDeck));
    const group =
      clusterBySimilarity(vectors).find((g) =>
        g.some((i) => all[i].deck_hash === hash)
      ) || [];
    return group.map((i) => all[i]).sort((a, b) => b.games - a.games);
  }, [rows, dbVersion, hash]);

  const totals = useMemo(() => {
    const games = versions.reduce((s, v) => s + v.games, 0);
    const wins = versions.reduce((s, v) => s + v.wins, 0);
    return { games, wins, losses: games - wins };
  }, [versions]);

  const average = useMemo(
    () =>
      averageDecklist(
        versions.map((v) => ({ cards: v.deck?.mainDeck, weight: v.games }))
      ),
    [versions]
  );

  // Averaged separately so "Copy to Arena" carries a sideboard too.
  const averageSide = useMemo(
    () =>
      averageDecklist(
        versions.map((v) => ({ cards: v.deck?.sideboard, weight: v.games }))
      ),
    [versions]
  );

  // The deck currently being shown: either the consensus list or one version.
  const shown = useMemo(() => {
    const source =
      selected === AVERAGE
        ? { mainDeck: average, sideboard: averageSide as any[] }
        : {
            mainDeck: versions[selected]?.deck?.mainDeck || [],
            sideboard: versions[selected]?.deck?.sideboard || [],
          };
    const base: any = versions[0]?.deck || {};
    const deck = new Deck(
      base,
      source.mainDeck as any,
      source.sideboard as any
    );
    deck.setName(
      selected === AVERAGE
        ? `${base.name || "Deck"} — average`
        : base.name || "Deck"
    );
    deck.tile = base.deckTileId || deck.tile;
    deck.sortMainboard(compareCards);
    deck.sortSideboard(compareCards);
    return deck;
  }, [selected, average, averageSide, versions]);

  const copyArena = (): void => {
    copyToClipboard(shown.getExportArena());
    reduxAction(dispatch, {
      type: "SET_POPUP",
      arg: {
        text: "Deck copied to clipboard.",
        duration: 5000,
        time: new Date().getTime(),
      },
    });
  };

  const title = versions[0]?.deck?.name || "Deck";

  return (
    <div style={{ padding: "0 16px" }}>
      <Section
        style={{
          margin: "16px 0",
          padding: "16px 20px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: "20px", color: "var(--color-text)" }}>
            {title}
          </div>
          <div style={{ fontSize: "13px", color: "var(--color-text-dark)" }}>
            {getEventPrettyName(id)} · {totals.games} games · {totals.wins}-
            {totals.losses} ·{" "}
            {versions.length === 1
              ? "1 version"
              : `${versions.length} versions`}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button onClick={copyArena} text="Copy to Arena" />
          <Button
            onClick={() => history.push(`/explore/${encodeURIComponent(id)}`)}
            text="Go back"
          />
        </div>
      </Section>

      {rows === null || !dbVersion ? (
        <Section
          style={{
            margin: "16px 0",
            padding: "32px",
            justifyContent: "center",
          }}
        >
          <div style={{ color: "var(--color-text-dark)" }}>Loading…</div>
        </Section>
      ) : (
        <div className="explore-deck-detail">
          <Section style={{ padding: "16px", flexDirection: "column" }}>
            <div className="separator-title" style={{ marginBottom: "8px" }}>
              {selected === AVERAGE
                ? "Average decklist"
                : `Version ${selected + 1}`}
            </div>
            {selected === AVERAGE && versions.length > 1 && (
              <div className="explore-meta-note">
                Each card averaged across all {versions.length} versions,
                weighted by how much each was played. A description of what this
                deck tends to run — rounding each slot means it may not total
                60.
              </div>
            )}
            {/* Same presentation as the deck-image popup: art banner carrying
                the name and colours, over a narrow list. */}
            <div className="explore-deck-sheet">
              <div
                className="decks-top small"
                style={{
                  backgroundImage: `url(${getCardArtCrop(
                    shown.tile || DEFAULT_TILE
                  )})`,
                }}
              >
                <DeckColorsBar deck={shown} />
                <div className="top-inner">
                  <div
                    style={{
                      lineHeight: "32px",
                      color: "var(--color-text-hover)",
                      textShadow: "3px 3px 6px #000000",
                    }}
                  >
                    {shown.getName()}
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex" }}>
                    <ManaCost
                      className="mana-s20"
                      colors={shown.colors.get()}
                    />
                  </div>
                </div>
              </div>
              <DeckList deck={shown} showWildcards={false} />
            </div>
          </Section>

          <Section style={{ padding: "16px", flexDirection: "column" }}>
            <div className="separator-title" style={{ marginBottom: "8px" }}>
              Versions
            </div>

            <button
              type="button"
              className={`explore-version ${
                selected === AVERAGE ? "explore-version-on" : ""
              }`}
              onClick={() => setSelected(AVERAGE)}
            >
              <span className="explore-version-name">Average</span>
              <span className="explore-version-n">{totals.games} games</span>
            </button>

            {versions.map((version, index) => (
              <button
                type="button"
                key={version.deck_hash}
                className={`explore-version ${
                  selected === index ? "explore-version-on" : ""
                }`}
                onClick={() => setSelected(index)}
              >
                <span className="explore-version-name">
                  {/* the lists in a group usually share one name, so repeating
                      it down the panel says nothing — number them instead, and
                      only show a name when it actually differs */}
                  {version.deck?.name && version.deck.name !== title
                    ? `${index + 1}. ${version.deck.name}`
                    : `Version ${index + 1}`}
                </span>
                <span className="explore-version-n">
                  {version.games} games · {version.winrate.toFixed(0)}%
                </span>
              </button>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}
