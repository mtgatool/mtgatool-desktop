import { useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";

import fetchExploreDecks, {
  ExploreDeckRow,
} from "../../../data/fetchExploreDecks";
import {
  ExploreMetaEventRow,
  fetchExploreMetaEvents,
} from "../../../data/fetchExploreMeta";
import Section from "../../ui/Section";

function prettyEvent(id: string): string {
  return id.replace(/_/g, " ");
}

export default function ViewExploreHome(): JSX.Element {
  const history = useHistory();
  const [rows, setRows] = useState<ExploreDeckRow[] | null>(null);
  const [metaEvents, setMetaEvents] = useState<ExploreMetaEventRow[] | null>(
    null
  );

  useEffect(() => {
    let alive = true;
    fetchExploreDecks().then((r) => {
      if (alive) setRows(r);
    });
    fetchExploreMetaEvents().then((r) => {
      if (alive) setMetaEvents(r);
    });
    return () => {
      alive = false;
    };
  }, []);

  // An event is worth listing if it has aggregated decks OR an opponent meta —
  // the meta needs far fewer of our own players to become meaningful, so it is
  // usually the one that fills in first.
  const events = useMemo(() => {
    const map = new Map<string, { decks: number; games: number }>();
    (rows || []).forEach((r) => {
      const e = map.get(r.event_id) || { decks: 0, games: 0 };
      e.decks += 1;
      e.games += r.games;
      map.set(r.event_id, e);
    });
    (metaEvents || []).forEach((m) => {
      const e = map.get(m.event_id) || { decks: 0, games: 0 };
      e.games = Math.max(e.games, m.matches);
      map.set(m.event_id, e);
    });
    return [...map.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.games - a.games);
  }, [rows, metaEvents]);

  const loading = rows === null || metaEvents === null;

  return (
    <div style={{ padding: "0 16px" }}>
      <Section
        style={{ margin: "16px 0", padding: "20px", flexDirection: "column" }}
      >
        <div className="separator-title">Explore — the field, by event</div>
        <div
          style={{
            fontSize: "13px",
            color: "var(--color-text-dark)",
            marginTop: "6px",
          }}
        >
          Decks are aggregated across all players and grouped by decklist, and
          appear once one has at least 5 matches. Each event also shows what the
          opponents you faced were playing.
        </div>
      </Section>

      {loading && (
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

      {!loading && events.length === 0 && (
        <Section
          style={{
            margin: "16px 0",
            padding: "40px",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              textAlign: "center",
              color: "var(--color-text-dark)",
              maxWidth: "460px",
            }}
          >
            No events have enough data yet. Explore fills in as more players
            sync their matches — decks show up once one has at least 5 matches.
          </div>
        </Section>
      )}

      {events.length > 0 && (
        <Section
          style={{
            margin: "16px 0 24px",
            padding: "16px",
            flexDirection: "column",
          }}
        >
          {events.map((e) => (
            <div
              key={e.id}
              className="list-item-container"
              onClick={() =>
                history.push(`/explore/${encodeURIComponent(e.id)}`)
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 8px",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  flex: 1,
                  color: "var(--color-text)",
                  fontSize: "16px",
                }}
              >
                {prettyEvent(e.id)}
              </div>
              <div
                style={{ color: "var(--color-text-dark)", fontSize: "13px" }}
              >
                {e.decks > 0
                  ? `${e.decks} deck${e.decks === 1 ? "" : "s"} · `
                  : ""}
                {e.games} games
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}
