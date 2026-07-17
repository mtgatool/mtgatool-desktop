import { useEffect, useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";

import fetchExploreDecks, {
  ExploreDeckRow as Row,
} from "../../../data/fetchExploreDecks";
import getEventPrettyName from "../../../utils/getEventPrettyName";
import Button from "../../ui/Button";
import Section from "../../ui/Section";
import ExploreDeckRow from "./ExploreDeckRow";

export default function ViewExploreEvent(): JSX.Element {
  const params = useParams<{ id: string }>();
  const history = useHistory();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetchExploreDecks(params.id).then((r) => {
      if (alive) setRows(r);
    });
    return () => {
      alive = false;
    };
  }, [params.id]);

  // Best decks first, then most-played.
  const decks = useMemo(
    () =>
      [...(rows || [])].sort(
        (a, b) => b.winrate - a.winrate || b.games - a.games
      ),
    [rows]
  );

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
          <div className="separator-title" style={{ marginBottom: "8px" }}>
            Decks by win rate — click to see the list
          </div>
          {decks.map((row) => (
            <ExploreDeckRow key={row.deck_hash} row={row} />
          ))}
        </Section>
      )}
    </div>
  );
}
