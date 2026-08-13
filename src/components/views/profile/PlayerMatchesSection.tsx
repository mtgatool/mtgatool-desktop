import { useCallback, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";

import {
  getPlayerMatches,
  PlayerMatchesPage,
  PlayerMatchRow,
} from "../../../data/publicProfiles";
import PatreonInfo from "../../popups/PatreonInfo";
import Button from "../../ui/Button";
import Section from "../../ui/Section";
import ProfileListItemMatch from "./ProfileListItemMatch";

/** How many matches everyone can see; the server enforces the same number. */
const PUBLIC_MATCHES = 5;
/** Page size for supporters browsing past the public window. */
const HISTORY_PAGE = 25;

interface PlayerMatchesSectionProps {
  /** Profile identifier — username or arena id — for lookups and match links. */
  id: string;
  /** Restrict to one deck (Arena deck id). */
  deckId?: string;
  title?: string;
}

/**
 * A player's public match list: the last five for everyone, pageable for
 * Standard-tier patrons, the Patreon pitch for everyone else. Used by the
 * profile page, the profile deck page and the shared-deck page.
 */
export default function PlayerMatchesSection({
  id,
  deckId,
  title = "Recent matches",
}: PlayerMatchesSectionProps): JSX.Element | null {
  const history = useHistory();
  const [page, setPage] = useState<PlayerMatchesPage | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showPatreonPopup, setShowPatreonPopup] = useState(false);
  // Guards both fetches against navigation: a slow answer for the previous
  // profile or deck must not land in the new one's list.
  const requestKey = useRef("");

  useEffect(() => {
    let cancelled = false;
    requestKey.current = `${id}|${deckId ?? ""}`;
    setPage(null);
    // A discarded stale continuation never clears this; do it here or the
    // new list can never load more.
    setLoadingMore(false);
    getPlayerMatches({ arenaId: id }, PUBLIC_MATCHES, 0, deckId)
      .then(
        (p) =>
          p ?? getPlayerMatches({ username: id }, PUBLIC_MATCHES, 0, deckId)
      )
      .then((p) => {
        if (!cancelled && p) setPage(p);
      });
    return () => {
      cancelled = true;
    };
  }, [id, deckId]);

  const loadMore = useCallback(() => {
    if (!page || loadingMore) return;
    const key = `${id}|${deckId ?? ""}`;
    setLoadingMore(true);
    getPlayerMatches({ arenaId: id }, HISTORY_PAGE, page.matches.length, deckId)
      .then(
        (p) =>
          p ??
          getPlayerMatches(
            { username: id },
            HISTORY_PAGE,
            page.matches.length,
            deckId
          )
      )
      .then((p) => {
        if (requestKey.current !== key) return;
        setLoadingMore(false);
        if (p && p.matches.length > 0) {
          setPage({
            ...p,
            matches: [...page.matches, ...p.matches],
          });
        }
      });
  }, [id, deckId, page, loadingMore]);

  const openMatch = useCallback(
    (row: PlayerMatchRow) => {
      history.push(
        `/profile/${encodeURIComponent(id)}/match/${encodeURIComponent(
          row.match_id
        )}`
      );
    },
    [history, id]
  );

  if (!page || page.total === 0) return null;

  const hasMore = page.matches.length < page.total;

  return (
    <Section
      style={{ flexDirection: "column", padding: "16px", margin: "16px 0 0" }}
    >
      <div className="profile-section-title">{title}</div>
      {page.matches.map((row) => (
        <ProfileListItemMatch
          row={row}
          key={`player-match-${row.match_id}`}
          openMatchCallback={openMatch}
        />
      ))}
      {hasMore ? (
        <Button
          style={{ margin: "16px auto 0" }}
          text={
            loadingMore
              ? "Loading..."
              : `Show more (${page.matches.length} of ${page.total})`
          }
          // Full history is a Standard-tier perk; everyone else gets the
          // upgrade pitch instead of another page.
          onClick={
            page.full_access ? loadMore : (): void => setShowPatreonPopup(true)
          }
          disabled={loadingMore}
        />
      ) : null}
      {showPatreonPopup ? (
        <PatreonInfo closeCallback={(): void => setShowPatreonPopup(false)} />
      ) : null}
    </Section>
  );
}
