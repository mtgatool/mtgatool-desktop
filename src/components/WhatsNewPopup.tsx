/**
 * "What's new" release-notes modal, shown once per app version (tracked by the
 * `whatsNewSeen` local setting). Wired from App.tsx after login.
 */
import info from "../info.json";
import Button from "./ui/Button";

interface WhatsNewItem {
  title: string;
  body: string;
}

const V7: WhatsNewItem[] = [
  {
    title: "Cloud accounts that sync across devices",
    body: "Sign in and your matches, decks, collection and rank sync to the cloud — log in anywhere and everything comes back.",
  },
  {
    title: "New Home dashboard",
    body: "Your rank, recent performance, top decks and wildcard/economy totals at a glance the moment you open the app.",
  },
  {
    title: "Timeline",
    body: "Win rate and rank progression over time, with coloured bands showing which deck you played across each stretch and a badge each time you rank up.",
  },
  {
    title: "Saved decks & a revived Explore",
    body: "Your in-game saved decks show up automatically, and Explore is back — the best-performing decks for each event, aggregated across all players and grouped by decklist.",
  },
  {
    title: "Faster, sturdier under the hood",
    body: "Rebuilt on a new backend, quicker startup (only new matches are read live), and the cards database now updates itself automatically.",
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
      <h1 style={{ margin: "0 0 4px" }}>What&apos;s new</h1>
      <div style={{ color: "var(--color-text-dark)", marginBottom: "16px" }}>
        MTG Arena Tool v{info.version}
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px" }}>
        {V7.map((item) => (
          <div key={item.title} style={{ marginBottom: "18px" }}>
            <div
              style={{
                color: "var(--color-text-hover)",
                fontSize: "17px",
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
