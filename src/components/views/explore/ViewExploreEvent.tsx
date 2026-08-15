import { useEffect, useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";

import fetchExploreDecks, {
  ExploreDeckRow as Row,
} from "../../../data/fetchExploreDecks";
import {
  ExploreMetaEventRow,
  fetchExploreMetaEvents,
} from "../../../data/fetchExploreMeta";
import { useCards } from "../../../hooks/useCard";
import useCardDatabaseVersion from "../../../hooks/useCardDatabaseVersion";
import { clusterBySimilarity, deckVector } from "../../../utils/deckSimilarity";
import getEventPrettyName from "../../../utils/getEventPrettyName";
import Button from "../../ui/Button";
import Section from "../../ui/Section";
import ExploreDeckRow from "./ExploreDeckRow";
import ExploreMostUsedCards from "./ExploreMostUsedCards";

export default function ViewExploreEvent(): JSX.Element {
  const params = useParams<{ id: string }>();
  const history = useHistory();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [event, setEvent] = useState<ExploreMetaEventRow | undefined>();

  useEffect(() => {
    let alive = true;
    fetchExploreDecks(params.id).then((r) => {
      if (alive) setRows(r);
    });
    fetchExploreMetaEvents().then((events) => {
      if (alive) setEvent(events.find((e) => e.event_id === params.id));
    });
    return () => {
      alive = false;
    };
  }, [params.id]);

  const dbVersion = useCardDatabaseVersion();

  /**
   * Load every card these lists mention, before clustering reads them.
   *
   * deckVector looks each card up and skips what it cannot resolve, and card
   * lookups only return what has already been fetched. Nothing here had ever
   * asked for these, so on a first visit every vector came out empty, nothing
   * merged, and one deck appeared as nine separate entries. `cardsLoaded` is in
   * the memo's dependencies so the clustering redoes itself once they land.
   */
  const rowGrpIds = useMemo(() => {
    const ids = new Set<number>();
    (rows || []).forEach((row) => {
      const deck: any = row.deck || {};
      (deck.mainDeck || []).forEach((card: any) => {
        if (card?.id) ids.add(card.id);
      });
    });
    return [...ids];
  }, [rows]);

  const cardsLoaded = useCards(rowGrpIds).filter(Boolean).length;

  // Near-identical lists are merged into one entry before ranking: without it a
  // deck that was tweaked between sessions appears several times over, each copy
  // holding too few games to say anything. The most-played list in a group
  // represents it, and its games/wins are the group's total.
  //
  // `pilots` is deliberately not summed — the view exposes counts, not user ids,
  // so the same person's two lists cannot be told from two people's. The number
  // of versions is shown instead, and pilots falls back to the largest single
  // list's count, which is a floor rather than a guess.
  const decks = useMemo(() => {
    const all = rows || [];
    if (!dbVersion || all.length === 0) return all;

    const vectors = all.map((row) => deckVector(row.deck?.mainDeck));

    return clusterBySimilarity(vectors)
      .map((group) => {
        const members = group
          .map((i) => all[i])
          .sort((a, b) => b.games - a.games);
        const lead = members[0];
        if (members.length === 1) return { ...lead, versions: 1 };

        const games = members.reduce((sum, m) => sum + m.games, 0);
        const wins = members.reduce((sum, m) => sum + m.wins, 0);
        const losses = members.reduce((sum, m) => sum + m.losses, 0);
        return {
          ...lead,
          games,
          wins,
          losses,
          winrate: games ? (wins / games) * 100 : 0,
          pilots: Math.max(...members.map((m) => m.pilots)),
          versions: members.length,
          last_played: members
            .map((m) => m.last_played)
            .sort()
            .reverse()[0],
        };
      })
      .sort((a, b) => b.winrate - a.winrate || b.games - a.games);
  }, [rows, dbVersion, cardsLoaded]);

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
        <div style={{ fontSize: "20px", color: "var(--color-text)" }}>
          {getEventPrettyName(params.id)}
        </div>
        <Button onClick={() => history.push("/explore")} text="Go back" />
      </Section>

      {rows === null && (
        <Section
          style={{
            margin: "16px 0",
            padding: "32px",
            justifyContent: "center",
          }}
        >
          <div style={{ color: "var(--color-text-dark)" }}>Loading…</div>
        </Section>
      )}

      {rows !== null && decks.length === 0 && (
        <Section
          style={{
            margin: "16px 0",
            padding: "40px",
            justifyContent: "center",
          }}
        >
          <div style={{ color: "var(--color-text-dark)", textAlign: "center" }}>
            No decks with enough data for this event yet.
          </div>
        </Section>
      )}

      {decks.length > 0 && (
        <Section
          style={{
            margin: "16px 0 24px",
            padding: "16px",
            flexDirection: "column",
          }}
        >
          <div className="separator-title" style={{ marginBottom: "12px" }}>
            Decks by win rate — click to see the list
          </div>
          <div className="explore-deck-grid">
            {decks.map((row) => (
              <ExploreDeckRow key={row.deck_hash} row={row} />
            ))}
          </div>
        </Section>
      )}

      <ExploreMostUsedCards decks={decks} eventId={params.id} event={event} />
    </div>
  );
}
