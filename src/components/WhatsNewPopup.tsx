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

/**
 * What changed in the release being shipped.
 *
 * Keep this current: the popup fires whenever `whatsNewSeen` no longer matches
 * the version, so a release goes out with whatever is written here. Anything
 * users would notice — a feature, or a bug that was visibly getting their data
 * wrong — belongs in it, described by what they will see rather than by what
 * was changed in the code. Clear it out and start again on the next release, so
 * it never becomes a running changelog.
 */
const NEW_IN_THIS_VERSION: WhatsNewItem[] = [
  {
    title: "Post-match overview",
    body: "Resurrected post match overview popup when a match ends: life totals through each game, cards cast, mana spent, and a turn-by-turn timeline of how it played out.",
  },
  {
    title: "Faster card database",
    body: "Card data is now quicker to start, and much lighter on memory.",
  },
  {
    title: "Rebuilt deck view",
    body: "New mana curve, colour and rarity panels, sample hands, and deck list image view you can save for sharing. Fixed some issues with the lands panel and colours.",
  },
  {
    title: "More accurate match tracking",
    body: "Fixed issues with opening hands going missing, games in a best-of-three sharing each other's card counts, and carry-over issues between matches.",
  },
];

/** Shown to anyone arriving from v6, alongside the migration notice. */
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

function ItemList({ items }: { items: WhatsNewItem[] }): JSX.Element {
  return (
    <>
      {items.map((item) => (
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
    </>
  );
}

const headingStyle = {
  color: "var(--color-text-dark)",
  fontSize: "13px",
  marginBottom: "16px",
};

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
        <div style={headingStyle}>New in v{info.version}:</div>
        <ItemList items={NEW_IN_THIS_VERSION} />

        {/* Everything below only concerns someone arriving from v6 — by now
            most people updating are already on v7 and have read it. Collapsed
            rather than dropped, because the account and history warnings are
            still the first thing a v6 user needs. <details> keeps that a
            plain-HTML disclosure with no state to manage. */}
        <details
          style={{
            border: "1px solid var(--color-line-sep)",
            borderRadius: "6px",
            padding: "12px 16px",
            marginTop: "24px",
            background: "var(--color-section-hover)",
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              color: "var(--color-text-hover)",
              fontSize: "15px",
            }}
          >
            Coming from v6? Read this first
          </summary>

          <div
            style={{
              color: "var(--color-text-hover)",
              fontSize: "16px",
              margin: "14px 0 6px",
            }}
          >
            This version has breaking changes.
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
              play (assisted by real-time memory reading). You can change this
              in settings, but some data — like ranks — will be missing from
              past matches, and we can&apos;t guarantee it works correctly.
            </li>
          </ul>

          <div style={{ ...headingStyle, margin: "20px 0 16px" }}>
            Also new since v6:
          </div>
          <ItemList items={NEW_IN_V7} />
        </details>
      </div>

      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}
      >
        <Button text="Got it" onClick={onClose} />
      </div>
    </div>
  );
}
