import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { ExploreDeckRow } from "../../../data/fetchExploreDecks";
import {
  ExploreMetaCardRow,
  ExploreMetaEventRow,
  fetchExploreMetaCards,
} from "../../../data/fetchExploreMeta";
import { useCards } from "../../../hooks/useCard";
import useCardDatabaseVersion from "../../../hooks/useCardDatabaseVersion";
import { AppState } from "../../../redux/stores/rendererStore";
import aggregateMostUsedCards from "../../../utils/exploreMostUsedCards";
import { getCardImage } from "../../../utils/getCardArtCrop";
import getWinrateClass from "../../../utils/getWinrateClass";
import database from "../../../utils/mtga/database";
import Button from "../../ui/Button";
import Section from "../../ui/Section";

const INITIAL_CARDS = 20;

type SortKey = "decks" | "avg" | "field" | "winrate";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "decks", label: "Decks" },
  { key: "avg", label: "Copies" },
  { key: "field", label: "Field" },
  { key: "winrate", label: "Win rate" },
];

/** What the opponent meta knows about a card, keyed by front-face name. */
interface FieldStat {
  presence: number;
  winrate: number;
  games: number;
}

/**
 * Fold the per-grpid meta rows into per-name field stats.
 *
 * Presence is recomputed from the summed match count rather than added up: a
 * deck running two printings would otherwise count its match twice.
 */
function fieldByName(rows: ExploreMetaCardRow[]): Map<string, FieldStat> {
  const acc = new Map<
    string,
    { seen: number; observed: number; wins: number; losses: number }
  >();

  rows.forEach((row) => {
    const card = database.card(row.grpid);
    if (!card) return;
    const name = card.Name.split(" // ")[0];
    const prev = acc.get(name);
    if (!prev) {
      acc.set(name, {
        seen: row.seen_in,
        observed: row.observed_matches,
        wins: row.wins,
        losses: row.losses,
      });
      return;
    }
    prev.seen += row.seen_in;
    prev.wins += row.wins;
    prev.losses += row.losses;
    prev.observed = Math.max(prev.observed, row.observed_matches);
  });

  const out = new Map<string, FieldStat>();
  acc.forEach((v, name) => {
    out.set(name, {
      presence: v.observed ? Math.min(100, (v.seen / v.observed) * 100) : 0,
      winrate: v.wins + v.losses ? (v.wins / (v.wins + v.losses)) * 100 : 0,
      games: v.wins + v.losses,
    });
  });
  return out;
}

/**
 * The cards that define an event, drawn as cards.
 *
 * Two different samples meet here, and the layout keeps them apart on purpose.
 * The headline figures — how many decks run a card, and how many copies they
 * run — come from real decklists, where the quantities are exact. Underneath,
 * "field" and its win rate come from the opponent meta, a much larger sample of
 * what the ladder played but one where quantities are inferred and so never
 * shown. A card can be high in one and absent from the other.
 */
export default function ExploreMostUsedCards({
  decks,
  eventId,
  event,
}: {
  decks: ExploreDeckRow[];
  eventId: string;
  event?: ExploreMetaEventRow;
}): JSX.Element | null {
  const [metaRows, setMetaRows] = useState<ExploreMetaCardRow[] | null>(null);
  const [sort, setSort] = useState<SortKey>("decks");
  const [expanded, setExpanded] = useState(false);

  const dbVersion = useCardDatabaseVersion();
  const cardQuality = useSelector(
    (state: AppState) => state.settings.cardsQuality
  );

  useEffect(() => {
    let alive = true;
    setMetaRows(null);
    fetchExploreMetaCards(eventId).then((r) => {
      if (alive) setMetaRows(r);
    });
    return () => {
      alive = false;
    };
  }, [eventId]);

  /**
   * Load every card both samples name before the memos read them.
   *
   * A card lookup only answers for cards that have already been fetched, so
   * without this the aggregation sees nothing on a first visit and renders an
   * empty list. `cardsLoaded` is in the dependencies so it redoes itself once
   * they land.
   */
  const grpIds = useMemo(() => {
    const ids = new Set<number>();
    decks.forEach((row) => {
      (row.deck?.mainDeck || []).forEach((c: { id?: number }) => {
        if (c?.id) ids.add(c.id);
      });
    });
    (metaRows || []).forEach((r) => {
      if (r.grpid) ids.add(r.grpid);
    });
    return [...ids];
  }, [decks, metaRows]);

  const cardsLoaded = useCards(grpIds).filter(Boolean).length;

  const cards = useMemo(() => {
    if (!dbVersion) return [];
    const field = fieldByName(metaRows || []);
    return aggregateMostUsedCards(decks).map((c) => ({
      ...c,
      field: field.get(c.name),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decks, metaRows, dbVersion, cardsLoaded]);

  const sorted = useMemo(() => {
    const list = [...cards];
    switch (sort) {
      case "avg":
        return list.sort(
          (a, b) => b.avgPerDeck - a.avgPerDeck || b.decks - a.decks
        );
      case "field":
        return list.sort(
          (a, b) => (b.field?.presence || 0) - (a.field?.presence || 0)
        );
      case "winrate":
        return list.sort((a, b) => b.deckWinrate - a.deckWinrate);
      default:
        return list;
    }
  }, [cards, sort]);

  if (dbVersion !== 0 && metaRows !== null && cards.length === 0) return null;

  const visible = expanded ? sorted : sorted.slice(0, INITIAL_CARDS);
  const deckCount = decks.length;

  return (
    <Section
      style={{
        margin: "16px 0 24px",
        padding: "16px",
        flexDirection: "column",
      }}
    >
      <div className="separator-title" style={{ marginBottom: "4px" }}>
        Most used cards
      </div>
      <div className="explore-meta-note">
        {`Across ${deckCount} deck${deckCount === 1 ? "" : "s"} with enough
        games to rank. Copies are exact — these are real lists. `}
        {event
          ? `"Field" is the share of ${event.observed_matches} matches against
             ${event.opponents} different opponents where the card turned up,
             and that win rate belongs to the decks that played it. `
          : ""}
        Lands are excluded.
      </div>

      {(dbVersion === 0 || metaRows === null) && cards.length === 0 && (
        <div
          style={{
            color: "var(--color-text-dark)",
            padding: "24px",
            margin: "auto",
          }}
        >
          Loading…
        </div>
      )}

      {cards.length > 0 && (
        <>
          <div className="explore-meta-sorts">
            <span className="explore-meta-sorts-label">Sort by</span>
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`explore-meta-sort ${
                  sort === s.key ? "explore-meta-sort-on" : ""
                }`}
                onClick={() => setSort(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="explore-cards-grid">
            {visible.map((c) => {
              const card = database.card(c.grpid);
              return (
                <div className="explore-cards-item" key={c.name}>
                  {card ? (
                    <img
                      className="explore-cards-img"
                      src={getCardImage(card, cardQuality)}
                      alt={c.name}
                      title={c.name}
                    />
                  ) : (
                    <div className="explore-cards-img explore-cards-img-missing" />
                  )}

                  <div className="explore-cards-figure">{c.decks}</div>
                  <div className="explore-cards-label">
                    Deck{c.decks === 1 ? "" : "s"} using it
                  </div>

                  <div className="explore-cards-figure">
                    {c.avgPerDeck.toFixed(2)}
                  </div>
                  <div className="explore-cards-label">Avg. per deck</div>

                  <div className="explore-cards-extra">
                    {c.field ? (
                      <span
                        title={`seen in ${c.field.presence.toFixed(
                          1
                        )}% of observed matches`}
                      >
                        {c.field.presence.toFixed(1)}% field
                      </span>
                    ) : (
                      <span title="not seen in the opponent sample">—</span>
                    )}
                    <span
                      className={getWinrateClass(c.deckWinrate / 100, true)}
                      title={`decks running it: ${c.wins}-${
                        c.games - c.wins
                      } over ${c.games} games`}
                    >
                      {c.deckWinrate.toFixed(0)}% WR
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {sorted.length > INITIAL_CARDS && (
            <Button
              style={{ margin: "16px auto 0" }}
              text={expanded ? "Show less" : `Show all ${sorted.length} cards`}
              onClick={() => setExpanded(!expanded)}
            />
          )}
        </>
      )}
    </Section>
  );
}
