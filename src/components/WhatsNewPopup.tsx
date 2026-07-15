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
    title: "Saved decks & a revived Explore",
    body: "Your in-game saved decks show up automatically, and Explore is back — the best decks for each event, aggregated across all players by decklist.",
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
      <h1 style={{ margin: "0 0 4px" }}>
        Welcome to MTG Arena Tool v{info.version}
      </h1>
      <div style={{ color: "var(--color-text-dark)", marginBottom: "16px" }}>
        A fresh start on a new backend
      </div>

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
            Please note — this version is a clean break
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
              earlier versions won&apos;t work here.
            </li>
            <li>
              Your <b>match history and stats won&apos;t carry over</b> from
              previous versions. New matches are tracked from here on.
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
          New in v{info.version}:
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
