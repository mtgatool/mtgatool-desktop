import { useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";

import fetchExploreDecks, {
  ExploreDeckRow,
} from "../../../data/fetchExploreDecks";
import Section from "../../ui/Section";

function prettyEvent(id: string): string {
  return id.replace(/_/g, " ");
}

export default function ViewExploreHome(): JSX.Element {
  const history = useHistory();
  const [rows, setRows] = useState<ExploreDeckRow[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetchExploreDecks().then((r) => {
      if (alive) setRows(r);
    });
    return () => {
      alive = false;
    };
  }, []);

  const events = useMemo(() => {
    const map = new Map<string, { decks: number; games: number }>();
    (rows || []).forEach((r) => {
      const e = map.get(r.event_id) || { decks: 0, games: 0 };
      e.decks += 1;
      e.games += r.games;
      map.set(r.event_id, e);
    });
    return [...map.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.games - a.games);
  }, [rows]);

  return (
    <div style={{ padding: "0 16px" }}>
      <Section
        style={{ margin: "16px 0", padding: "20px", flexDirection: "column" }}
      >
        <div className="separator-title">Explore — best decks by event</div>
        <div
          style={{
            fontSize: "13px",
            color: "var(--color-text-dark)",
            marginTop: "6px",
          }}
        >
          Aggregated across all players and grouped by decklist. A deck appears
          once it has at least 10 matches from 2+ pilots.
        </div>
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

      {rows !== null && events.length === 0 && (
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
            sync their matches — decks show up once an event has at least 10
            matches from 2 or more pilots.
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
                {e.decks} deck{e.decks === 1 ? "" : "s"} · {e.games} games
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}
