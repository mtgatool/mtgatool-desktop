/**
 * "What's new" / migration-notice modal, shown once per app version (tracked by
 * the `whatsNewSeen` local setting) on app open, before login. Wired from
 * App.tsx.
 */
import info from "../info.json";
import Button from "./ui/Button";

interface WhatsNewItem {
  title: string;
  body: string;
}

const NEW_IN_V7: WhatsNewItem[] = [
  {
    title: "Home dashboard",
    body: "Your rank, recent performance, top decks and wildcard totals the moment you open the app.",
  },
  {
    title: "Timeline",
    body: "Win rate and rank progression over time, with bands showing which deck you played across each stretch and a badge each time you rank up.",
  },
  {
    title: "Saved decks & Explore",
    body: "Your in-game saved decks show up automatically (even those you don't play), and Explore is back — the best decks for each event, aggregated across all players by decklist.",
  },
];

export default function WhatsNewPopup({
  onClose,
}: {
  onClose: () => void;
}): JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "24px 28px",
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ margin: "0 0 16px" }}>
        Welcome to MTG Arena Tool v{info.version}
      </h1>

      <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px" }}>
        <div
          style={{
            border: "1px solid var(--color-line-sep)",
            borderRadius: "6px",
            padding: "14px 16px",
            marginBottom: "20px",
            background: "var(--color-section-hover)",
          }}
        >
          <div
            style={{
              color: "var(--color-text-hover)",
              fontSize: "16px",
              marginBottom: "6px",
            }}
          >
            Please note — this version has breaking changes.
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: "18px",
              color: "var(--color-text)",
              lineHeight: "22px",
            }}
          >
            <li>
              You&apos;ll need to <b>create a new account</b> — logins from
              earlier versions won&apos;t work here. The backend has been
              migrated to a new database and protocol.
            </li>
            <li>
              Because of this, your{" "}
              <b>match history and stats won&apos;t carry over</b> from previous
              versions. New matches are tracked from here on.
            </li>
            <li>
              Due to changes in the MTG Arena logs, we now only read them as you
              play (assisted by real-time memory reading). You can change this in
              settings, but some data — like ranks — will be missing from past
              matches, and we can&apos;t guarantee it works correctly.
            </li>
          </ul>
        </div>

        <div
          style={{
            color: "var(--color-text-dark)",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          Notable changes in v{info.version}:
        </div>
        {NEW_IN_V7.map((item) => (
          <div key={item.title} style={{ marginBottom: "16px" }}>
            <div
              style={{
                color: "var(--color-text-hover)",
                fontSize: "16px",
                marginBottom: "4px",
              }}
            >
              {item.title}
            </div>
            <div style={{ color: "var(--color-text)", lineHeight: "20px" }}>
              {item.body}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}
      >
        <Button text="Got it" onClick={onClose} />
      </div>
    </div>
  );
}
