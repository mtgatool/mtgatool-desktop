import { useCallback, useEffect, useState } from "react";
import { useHistory, useRouteMatch } from "react-router-dom";

import { DEFAULT_AVATAR } from "../../../constants";
import {
  getPlayerDecks,
  getPlayerProfile,
  PlayerDeckRow,
  PlayerDecksPage,
  PlayerProfile,
  ProfileAccount,
  ProfileRankSide,
  RecentRecord,
} from "../../../data/publicProfiles";
import cleanUsername from "../../../utils/cleanUsername";
import formatPercent from "../../../utils/formatPercent";
import getEventFormat from "../../../utils/getEventFormat";
import getPlayerNameWithoutSuffix from "../../../utils/getPlayerNameWithoutSuffix";
import timeAgo from "../../../utils/timeAgo";
import PatreonInfo from "../../popups/PatreonInfo";
import RankIcon from "../../RankIcon";
import SupporterBadge from "../../SupporterBadge";
import Button from "../../ui/Button";
import Section from "../../ui/Section";
import PlayerMatchesSection from "./PlayerMatchesSection";
import ProfileDeckRow from "./ProfileDeckRow";
import PublicDeckView from "./PublicDeckView";
import PublicMatchView from "./PublicMatchView";

function RankBlock({
  title,
  rank,
  record,
  format,
}: {
  title: string;
  rank: ProfileRankSide | null;
  /** Wins/losses over the last 30 days — season totals reset mid-story. */
  record: RecentRecord | null;
  format: "constructed" | "limited";
}): JSX.Element {
  // "Spark" is the placeholder a failed rank read writes; its numbers are
  // just as bogus as its class, so show the whole side as unranked.
  const isPlaceholder = rank?.class === "Spark";
  const cls = !rank?.class || isPlaceholder ? "Unranked" : rank.class;
  const wins = record?.wins ?? 0;
  const losses = record?.losses ?? 0;
  const games = wins + losses;

  let label = cls === "Unranked" ? "Unranked" : `${cls} ${rank?.level ?? ""}`;
  if (cls === "Mythic") {
    label =
      (rank?.leaderboardPlace ?? 0) > 0
        ? `Mythic #${rank?.leaderboardPlace}`
        : `Mythic ${(rank?.percentile ?? 0).toFixed(2)}%`;
  }

  return (
    <div className="profile-rank-block">
      <div className="profile-rank-title">{title}</div>
      <RankIcon
        rank={cls}
        tier={rank?.level ?? 0}
        step={rank?.step}
        percentile={rank?.percentile ?? 0}
        leaderboardPlace={rank?.leaderboardPlace ?? 0}
        format={format}
      />
      <div className="profile-rank-label">{label}</div>
      {games > 0 ? (
        <div className="profile-rank-record">
          {wins}-{losses}
          <span
            style={{
              color: wins / games >= 0.5 ? "var(--color-g)" : "var(--color-r)",
              marginLeft: "6px",
            }}
          >
            {((wins / games) * 100).toFixed(0)}%
          </span>
        </div>
      ) : (
        <div className="profile-rank-record">No recent games</div>
      )}
    </div>
  );
}

/** The visible account's ranks, on the right side of the banner. */
function BannerRanks({
  account,
  recent,
}: {
  account: ProfileAccount;
  recent: PlayerProfile["recent_30d"];
}): JSX.Element {
  return (
    <div className="profile-banner-ranks">
      <div className="profile-rank-blocks">
        <RankBlock
          title="Constructed"
          rank={account.constructed}
          record={recent?.constructed ?? null}
          format="constructed"
        />
        <RankBlock
          title="Limited"
          rank={account.limited}
          record={recent?.limited ?? null}
          format="limited"
        />
      </div>
      <div className="profile-ranks-updated">Record over the last 30 days</div>
    </div>
  );
}

/** "Timeless 95% · Limited 3% · Brawl 2%" chips from raw event-id counts. */
function FormatsSummary({
  counts,
}: {
  counts: Record<string, number>;
}): JSX.Element | null {
  const byFormat: Record<string, number> = {};
  let total = 0;
  Object.entries(counts).forEach(([eventId, n]) => {
    const fmt = getEventFormat(eventId);
    byFormat[fmt] = (byFormat[fmt] ?? 0) + n;
    total += n;
  });
  if (total === 0) return null;

  const entries = Object.entries(byFormat).sort((a, b) => b[1] - a[1]);
  return (
    <div className="profile-formats">
      {entries.map(([fmt, n]) => (
        <div className="profile-format-chip" key={`fmt-${fmt}`}>
          {fmt} <span>{formatPercent(n / total)}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * The player's decks with their records — a Standard-tier perk. Non-patrons
 * see the section with the upgrade pitch instead of the list.
 */
function DecksSection({ id }: { id: string }): JSX.Element | null {
  const history = useHistory();
  const [page, setPage] = useState<PlayerDecksPage | null>(null);
  const [showPatreonPopup, setShowPatreonPopup] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPage(null);
    getPlayerDecks({ arenaId: id })
      .then((p) => p ?? getPlayerDecks({ username: id }))
      .then((p) => {
        if (!cancelled && p) setPage(p);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const openDeck = useCallback(
    (row: PlayerDeckRow) => {
      history.push(
        `/profile/${encodeURIComponent(id)}/deck/${encodeURIComponent(row.id)}`
      );
    },
    [history, id]
  );

  if (!page) return null;
  if (page.full_access && page.decks.length === 0) return null;

  return (
    <Section
      style={{ flexDirection: "column", padding: "16px", margin: "16px 0 0" }}
    >
      <div className="profile-section-title">Decks</div>
      {page.full_access ? (
        <div className="decks-table-wrapper">
          {page.decks
            // A failed parse can upload an empty deck; there is nothing to
            // show or open for it.
            .filter((row) => row.id && (row.deck?.mainDeck?.length ?? 0) > 0)
            .map((row) => (
              <ProfileDeckRow
                key={`profile-deck-${row.id}`}
                row={row}
                clickDeck={openDeck}
              />
            ))}
        </div>
      ) : (
        <Button
          style={{ margin: "8px auto" }}
          text="See this player's decks"
          onClick={(): void => setShowPatreonPopup(true)}
        />
      )}
      {showPatreonPopup ? (
        <PatreonInfo closeCallback={(): void => setShowPatreonPopup(false)} />
      ) : null}
    </Section>
  );
}

/* eslint-disable no-nested-ternary */
function ProfileContent({ id }: { id: string }): JSX.Element {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!id) return undefined;
    setProfile(null);
    setMissing(false);
    let cancelled = false;
    // The id is an arena persona id when coming from the feeds; fall back to
    // a username lookup so /profile/<name> links work too.
    getPlayerProfile({ arenaId: id })
      .then((p) => p ?? getPlayerProfile({ username: id }))
      .then((p) => {
        if (cancelled) return;
        if (p) setProfile(p);
        else setMissing(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const bannerUrl = profile?.background?.imageUrl;

  return (
    <div className="profile-view">
      {missing ? (
        <Section
          style={{
            marginTop: "16px",
            padding: "48px",
            flexDirection: "column",
            textAlign: "center",
          }}
        >
          <div style={{ color: "var(--color-text-dark)" }}>
            This profile is private or does not exist.
          </div>
        </Section>
      ) : !profile ? (
        <Section style={{ marginTop: "16px", padding: "48px" }}>
          <div className="loading-sign" style={{ margin: "auto" }} />
        </Section>
      ) : (
        <>
          <div
            className={`profile-banner${bannerUrl ? " has-image" : ""}`}
            style={
              bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined
            }
          >
            <div className="profile-banner-inner">
              <div className="profile-banner-left">
                <div
                  className="profile-avatar"
                  style={{
                    backgroundImage: `url(${
                      profile.avatar_url || DEFAULT_AVATAR
                    })`,
                  }}
                />
                <div className="profile-identity">
                  <div className="profile-username">
                    {profile.username ||
                      cleanUsername(
                        getPlayerNameWithoutSuffix(
                          profile.account?.display_name || "Planeswalker"
                        )
                      )}
                    {profile.supporter_tier > 0 ? (
                      <SupporterBadge tier={profile.supporter_tier} />
                    ) : null}
                  </div>
                  {profile.member_since ? (
                    <div className="profile-member-since">
                      Playing with MTGATool since{" "}
                      {new Date(profile.member_since).toLocaleDateString(
                        undefined,
                        { year: "numeric", month: "long" }
                      )}
                    </div>
                  ) : null}
                  {profile.last_seen ? (
                    <div className="profile-member-since">
                      Last seen {timeAgo(new Date(profile.last_seen).getTime())}
                    </div>
                  ) : null}
                  <FormatsSummary counts={profile.format_counts ?? {}} />
                </div>
              </div>
              {profile.account ? (
                <BannerRanks
                  account={profile.account}
                  recent={profile.recent_30d}
                />
              ) : null}
            </div>
          </div>

          <DecksSection id={id} />
          <PlayerMatchesSection id={id} />
        </>
      )}
    </div>
  );
}

/**
 * Public player profile (/profile/<arenaId or username>). Everything shown
 * comes from the get_player_profile / get_player_matches RPCs, which serve
 * only public fields, for only one Arena account per player (their pinned
 * one, or the latest played), and answer with nothing for private-mode
 * profiles — so this screen cannot distinguish "private" from "does not
 * exist", by design. Arena ids are accepted as input but never displayed.
 * /profile/<id>/match/<matchId> opens a match's public view, and
 * /profile/<id>/deck/<hash> a deck's record and its matches (patron perk).
 */
export default function ViewProfile(): JSX.Element {
  const matchRoute = useRouteMatch<{ id: string; matchId: string }>(
    "/profile/:id/match/:matchId"
  );
  const deckRoute = useRouteMatch<{ id: string; hash: string }>(
    "/profile/:id/deck/:hash"
  );
  const profileRoute = useRouteMatch<{ id: string }>("/profile/:id");

  if (matchRoute) {
    return (
      <PublicMatchView
        profileId={decodeURIComponent(matchRoute.params.id)}
        matchId={decodeURIComponent(matchRoute.params.matchId)}
      />
    );
  }
  if (deckRoute) {
    return (
      <PublicDeckView
        profileId={decodeURIComponent(deckRoute.params.id)}
        deckId={decodeURIComponent(deckRoute.params.hash)}
      />
    );
  }

  const id = profileRoute?.params.id
    ? decodeURIComponent(profileRoute.params.id)
    : "";
  return <ProfileContent id={id} />;
}
