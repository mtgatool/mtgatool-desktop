import { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";

import { ReactComponent as BackIcon } from "../../../assets/images/svg/back.svg";
import {
  getPlayerDecks,
  getPlayerMatches,
  PlayerDeckRow,
  PlayerMatchesPage,
  PlayerMatchRow,
} from "../../../data/publicProfiles";
import { useCardArtCrop } from "../../../hooks/useCardImage";
import formatPercent from "../../../utils/formatPercent";
import getWinrateClass from "../../../utils/getWinrateClass";
import Colors from "../../../utils/mtga/colors";
import timeAgo from "../../../utils/timeAgo";
import ManaCost from "../../ManaCost";
import SvgButton from "../../SvgButton";
import Section from "../../ui/Section";
import ProfileListItemMatch from "./ProfileListItemMatch";

interface PublicDeckViewProps {
  profileId: string;
  deckId: string;
}

const PAGE_SIZE = 25;

/**
 * One of a profile's decks: its record and the matches played with it.
 * Reached from the profile's deck list, which is patron-gated — so is the
 * match lookup underneath this view.
 */
export default function PublicDeckView({
  profileId,
  deckId,
}: PublicDeckViewProps): JSX.Element {
  const history = useHistory();

  const [deck, setDeck] = useState<PlayerDeckRow | null>(null);
  const [page, setPage] = useState<PlayerMatchesPage | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDeck(null);
    setPage(null);
    getPlayerDecks({ arenaId: profileId })
      .then((p) =>
        p?.decks.length ? p : getPlayerDecks({ username: profileId })
      )
      .then((p) => {
        if (cancelled) return;
        setDeck(p?.decks.find((d) => d.id === deckId) ?? null);
      });
    getPlayerMatches({ arenaId: profileId }, PAGE_SIZE, 0, deckId)
      .then(
        (p) =>
          p ?? getPlayerMatches({ username: profileId }, PAGE_SIZE, 0, deckId)
      )
      .then((p) => {
        if (!cancelled && p) setPage(p);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId, deckId]);

  const loadMore = useCallback(() => {
    if (!page || loadingMore) return;
    setLoadingMore(true);
    getPlayerMatches(
      { arenaId: profileId },
      PAGE_SIZE,
      page.matches.length,
      deckId
    )
      .then(
        (p) =>
          p ??
          getPlayerMatches(
            { username: profileId },
            PAGE_SIZE,
            page.matches.length,
            deckId
          )
      )
      .then((p) => {
        setLoadingMore(false);
        if (p && p.matches.length > 0) {
          setPage({ ...p, matches: [...page.matches, ...p.matches] });
        }
      });
  }, [profileId, deckId, page, loadingMore]);

  const openMatch = useCallback(
    (row: PlayerMatchRow) => {
      history.push(
        `/profile/${encodeURIComponent(profileId)}/match/${encodeURIComponent(
          row.match_id
        )}`
      );
    },
    [history, profileId]
  );

  const deckArt = useCardArtCrop(deck?.deck?.deckTileId || 0);

  const colors = useMemo(
    () => new Colors().addFromBits(deck?.deck?.colors || 0).get(),
    [deck]
  );

  const wins = deck?.wins ?? 0;
  const games = deck?.games ?? 0;
  const winrate = games > 0 ? wins / games : 0;

  if (!page && !deck) {
    return (
      <div className="profile-view">
        <Section style={{ marginTop: "16px", padding: "48px" }}>
          <div className="loading-sign" style={{ margin: "auto" }} />
        </Section>
      </div>
    );
  }

  return (
    <div className="profile-view">
      <div
        className="matches-top"
        style={{
          backgroundImage: deckArt ? `url("${deckArt}")` : undefined,
        }}
      >
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
              {deck?.deck?.name || "Deck"}
            </div>
          </div>
          <div className="flex-item">
            <ManaCost className="manaS20" colors={colors} />
          </div>
        </div>
      </div>

      {deck ? (
        <Section
          style={{
            lineHeight: "36px",
            padding: "16px",
            margin: "16px 0 0",
            justifyContent: "space-around",
          }}
        >
          <div>
            Record:{" "}
            <span style={{ color: "var(--color-text-hover)" }}>
              {wins}-{games - wins}
            </span>
          </div>
          <div>
            Winrate:{" "}
            <span className={getWinrateClass(winrate, true)}>
              {formatPercent(winrate)}
            </span>
          </div>
          <div>
            Last played:{" "}
            <span style={{ color: "var(--color-text-hover)" }}>
              {timeAgo(new Date(deck.last_played).getTime())}
            </span>
          </div>
        </Section>
      ) : null}

      <Section
        style={{ flexDirection: "column", padding: "16px", margin: "16px 0" }}
      >
        <div className="profile-section-title">Matches with this deck</div>
        {(page?.matches ?? []).map((row) => (
          <ProfileListItemMatch
            row={row}
            key={`deck-match-${row.match_id}`}
            openMatchCallback={openMatch}
          />
        ))}
        {page && page.matches.length < page.total ? (
          <div
            className="profile-matches-more"
            onClick={loadingMore ? undefined : loadMore}
          >
            {loadingMore
              ? "Loading..."
              : `Show more (${page.matches.length} of ${page.total})`}
          </div>
        ) : null}
      </Section>
    </div>
  );
}
