import { useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";

import { ReactComponent as BackIcon } from "../../../assets/images/svg/back.svg";
import { DEFAULT_TILE } from "../../../constants";
import { getPlayerDecks, PlayerDeckRow } from "../../../data/publicProfiles";
import { useCards } from "../../../hooks/useCard";
import { useCardArtCrop } from "../../../hooks/useCardImage";
import useIsLoggedIn from "../../../hooks/useIsLoggedIn";
import Deck from "../../../utils/mtga/deck";
import timeAgo from "../../../utils/timeAgo";
import DeckColorsBar from "../../DeckColorsBar";
import ManaCost from "../../ManaCost";
import PublicDeckDetails from "../../PublicDeckDetails";
import PublicLoading from "../../PublicLoading";
import SvgButton from "../../SvgButton";
import Section from "../../ui/Section";
import PlayerMatchesSection from "./PlayerMatchesSection";

interface PublicDeckViewProps {
  profileId: string;
  deckId: string;
}

/**
 * One of a profile's decks: the same presentation as the shared-deck page
 * (list, charts, visual view) plus its aggregate record and the matches
 * played with it. Reached from the profile's deck list, which is
 * patron-gated — so is the match lookup underneath this view.
 */
export default function PublicDeckView({
  profileId,
  deckId,
}: PublicDeckViewProps): JSX.Element {
  const history = useHistory();
  const loggedIn = useIsLoggedIn();

  const [row, setRow] = useState<PlayerDeckRow | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRow(null);
    setLoaded(false);
    getPlayerDecks({ arenaId: profileId })
      .then((p) => p ?? getPlayerDecks({ username: profileId }))
      .then((p) => {
        if (cancelled) return;
        setRow(p?.decks.find((d) => d.id === deckId) ?? null);
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId, deckId]);

  const snapshot = row?.deck;

  // The list and charts read cards synchronously from the lookup cache,
  // which is empty on a cold public page. Prefetch and rebuild once they
  // land (same fix as the shared-deck page).
  const allIds = useMemo(() => {
    const ids = new Set<number>();
    (snapshot?.mainDeck || []).forEach((c) => ids.add(c.id));
    (snapshot?.sideboard || []).forEach((c) => ids.add(c.id));
    return [...ids];
  }, [snapshot]);
  const resolvedCards = useCards(allIds);

  const deck = useMemo(() => {
    const d = new Deck({}, snapshot?.mainDeck || [], snapshot?.sideboard || []);
    d.setName(snapshot?.name || "Deck");
    d.tile = snapshot?.deckTileId || DEFAULT_TILE;
    return d;
    // resolvedCards is the point: the charts read from the card cache,
    // which is only warm once these lookups come back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, resolvedCards]);

  const deckArt = useCardArtCrop(snapshot?.deckTileId || DEFAULT_TILE);

  if (!loaded) {
    return (
      <div className="profile-view">
        <Section style={{ marginTop: "16px", padding: "48px" }}>
          <PublicLoading inline />
        </Section>
      </div>
    );
  }

  const wins = row?.wins ?? 0;
  const games = row?.games ?? 0;

  return (
    <div className="profile-view">
      <div className="decks-top" style={{ backgroundImage: `url(${deckArt})` }}>
        <DeckColorsBar deck={deck} />
        <div className="top-inner">
          <div className="flex-item">
            <SvgButton
              style={{
                marginRight: "8px",
                backgroundColor: "var(--color-section)",
              }}
              svg={BackIcon}
              onClick={(): void => history.goBack()}
            />
            <div
              style={{
                lineHeight: "32px",
                color: "var(--color-text-hover)",
                textShadow: "3px 3px 6px #000000",
              }}
            >
              {deck.getName()}
            </div>
          </div>
          <div className="flex-item">
            <ManaCost className="mana-s20" colors={deck.getColors().get()} />
          </div>
        </div>
      </div>

      {row ? (
        <>
          <PublicDeckDetails
            deck={deck}
            showWildcards={loggedIn}
            recordSlot={
              games > 0 ? (
                <div
                  className="shared-deck-record"
                  title={
                    row.last_played
                      ? `Last played ${timeAgo(
                          new Date(row.last_played).getTime()
                        )}`
                      : undefined
                  }
                >
                  <span className="record">{`${wins}-${games - wins}`}</span>
                  <span
                    className="percent"
                    style={{
                      color:
                        wins / games >= 0.5
                          ? "var(--color-g)"
                          : "var(--color-r)",
                    }}
                  >
                    {`${((wins / games) * 100).toFixed(0)}%`}
                  </span>
                  <span className="record-label">win rate</span>
                </div>
              ) : undefined
            }
          />
          <PlayerMatchesSection
            id={profileId}
            deckId={deckId}
            title="Matches with this deck"
          />
        </>
      ) : (
        <Section
          style={{
            marginTop: "16px",
            padding: "48px",
            flexDirection: "column",
            textAlign: "center",
          }}
        >
          <div style={{ color: "var(--color-text-dark)" }}>
            This deck is not available.
          </div>
        </Section>
      )}
    </div>
  );
}
