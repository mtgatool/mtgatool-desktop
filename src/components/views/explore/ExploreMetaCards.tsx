import { useEffect, useMemo, useState } from "react";

import {
  ExploreMetaCardRow,
  ExploreMetaEventRow,
  fetchExploreMetaCards,
} from "../../../data/fetchExploreMeta";
import { useCards } from "../../../hooks/useCard";
import useCardDatabaseVersion from "../../../hooks/useCardDatabaseVersion";
import database from "../../../utils/mtga/database";
import Button from "../../ui/Button";
import Section from "../../ui/Section";
import ExploreMetaCard from "./ExploreMetaCard";

const INITIAL_ROWS = 25;

type SortKey = "presence" | "winrate";

interface Line {
  row: ExploreMetaCardRow;
  card: NonNullable<ReturnType<typeof database.card>>;
}

/**
 * Merge rows that are the same card under a different grpId.
 *
 * Arena mints a new grpId per printing, so a reprinted card shows up several
 * times over — the raw Ladder list has Forest twice. Double-faced cards are
 * recorded under both the front-face name and the combined "A // B" name, which
 * is why the key is the front face. Presence is recomputed from the summed match
 * count rather than added up, since a deck running two printings would otherwise
 * count its match twice; it is capped at 100 for the same reason.
 */
function mergePrintings(lines: Line[]): Line[] {
  const byName = new Map<string, Line>();

  lines.forEach((line) => {
    const key = line.card.Name.split(" // ")[0];
    const prev = byName.get(key);
    if (!prev) {
      byName.set(key, { ...line, row: { ...line.row } });
      return;
    }
    const r = prev.row;
    r.seen_in += line.row.seen_in;
    r.wins += line.row.wins;
    r.losses += line.row.losses;
    r.presence = Math.min(
      100,
      r.observed_matches ? (r.seen_in / r.observed_matches) * 100 : 0
    );
    r.winrate = r.wins + r.losses ? (r.wins / (r.wins + r.losses)) * 100 : 0;
  });

  return [...byName.values()];
}

/**
 * Opponent meta for one event: which cards the field is actually playing.
 *
 * Rendered as an auto-filling grid of art tiles. The bar on each tile encodes
 * one thing — presence — so it stays a single hue; identity comes from the art
 * and name. Win rate is a separate measure and sits beside the bar as its own
 * figure rather than becoming a second axis on it.
 */
export default function ExploreMetaCards({
  eventId,
  event,
}: {
  eventId: string;
  event?: ExploreMetaEventRow;
}): JSX.Element | null {
  const [rows, setRows] = useState<ExploreMetaCardRow[] | null>(null);
  const [sort, setSort] = useState<SortKey>("presence");
  const [expanded, setExpanded] = useState(false);

  const dbVersion = useCardDatabaseVersion();

  useEffect(() => {
    let alive = true;
    setRows(null);
    fetchExploreMetaCards(eventId).then((r) => {
      if (alive) setRows(r);
    });
    return () => {
      alive = false;
    };
  }, [eventId]);

  /**
   * Load the cards these rows name, before the memos below read them.
   *
   * Both look each card up and treat a miss as "metadata does not have it" —
   * but a lookup only returns what has already been fetched, and nothing had
   * asked for these. On a first visit that made every row unresolved: an empty
   * table, and an "unresolved" count equal to the whole list.
   */
  const rowGrpIds = useMemo(
    () => [...new Set((rows || []).map((r) => r.grpid).filter(Boolean))],
    [rows]
  );

  const cardsLoaded = useCards(rowGrpIds).filter(Boolean).length;

  const lines: Line[] = useMemo(() => {
    if (!dbVersion) return [];
    const all = (rows || [])
      .map((row) => ({ row, card: database.card(row.grpid) }))
      // metadata may still not have the card (published before a new set lands);
      // those are counted below rather than disappearing without trace
      .filter((l): l is Line => !!l.card)
      // Lands are excluded outright, not just basics. They are 75 of the 201
      // cards Ladder turns up, and they crowd out the actual signal: unfiltered,
      // the top Timeless card is Watery Grave. Dropping them leaves Daze /
      // Fatal Push / Brainstorm / Thoughtseize, which is the deck.
      .filter((l) => !l.card.Types.includes("Land"));

    return mergePrintings(all).sort((a, b) =>
      sort === "winrate"
        ? b.row.winrate - a.row.winrate || b.row.seen_in - a.row.seen_in
        : b.row.presence - a.row.presence || b.row.winrate - a.row.winrate
    );
  }, [rows, sort, dbVersion, cardsLoaded]);

  // Cards the metadata could not name. Worth saying out loud: a meta view that
  // quietly omits whatever is newest is wrong exactly when it matters most.
  const unresolved = useMemo(
    () =>
      !dbVersion
        ? 0
        : (rows || []).filter((r) => !database.card(r.grpid)).length,
    [rows, dbVersion, cardsLoaded]
  );

  // Bars are read against the most-played card, not against 100% — at ladder
  // presence levels a 0-100 scale would flatten every row into a stub.
  const maxPresence = useMemo(
    () => Math.max(...lines.map((l) => l.row.presence), 1),
    [lines]
  );

  if (rows !== null && dbVersion !== 0 && lines.length === 0) return null;

  const visible = expanded ? lines : lines.slice(0, INITIAL_ROWS);

  return (
    <Section
      style={{
        margin: "16px 0 24px",
        padding: "16px",
        flexDirection: "column",
      }}
    >
      <div className="separator-title" style={{ marginBottom: "4px" }}>
        What the field is playing
      </div>
      <div className="explore-meta-note">
        {event
          ? `Cards seen in ${event.observed_matches} matches against ${event.opponents} different opponents. `
          : ""}
        Presence is the share of those matches where the card showed up at least
        once — win rate belongs to the deck that played it, not to you. Lands
        are excluded.
      </div>

      {(rows === null || dbVersion === 0) && (
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

      {rows !== null && dbVersion !== 0 && lines.length > 0 && (
        <>
          <div className="explore-meta-sorts">
            <span className="explore-meta-sorts-label">Sort by</span>
            <button
              type="button"
              className={`explore-meta-sort ${
                sort === "presence" ? "explore-meta-sort-on" : ""
              }`}
              onClick={() => setSort("presence")}
            >
              Presence
            </button>
            <button
              type="button"
              className={`explore-meta-sort ${
                sort === "winrate" ? "explore-meta-sort-on" : ""
              }`}
              onClick={() => setSort("winrate")}
            >
              Win rate
            </button>
          </div>

          <div className="explore-meta-grid">
            {visible.map(({ row, card }) => (
              <ExploreMetaCard
                key={row.grpid}
                row={row}
                card={card}
                maxPresence={maxPresence}
              />
            ))}
          </div>

          {lines.length > INITIAL_ROWS && (
            <Button
              style={{ margin: "12px auto 0" }}
              text={expanded ? "Show less" : `Show all ${lines.length} cards`}
              onClick={() => setExpanded(!expanded)}
            />
          )}

          {unresolved > 0 && (
            <div className="explore-meta-note" style={{ marginTop: "12px" }}>
              {unresolved} card{unresolved === 1 ? "" : "s"} not in the current
              card database — update it from Settings to see{" "}
              {unresolved === 1 ? "it" : "them"}.
            </div>
          )}
        </>
      )}
    </Section>
  );
}
