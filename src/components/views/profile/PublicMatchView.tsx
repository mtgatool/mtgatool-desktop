import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";

import { ReactComponent as BackIcon } from "../../../assets/images/svg/back.svg";
import { ReactComponent as IconCrown } from "../../../assets/images/svg/crown.svg";
import { ReactComponent as IconEvent } from "../../../assets/images/svg/event.svg";
import { ReactComponent as IconTime } from "../../../assets/images/svg/time.svg";
import { getPublicMatch, PublicMatch } from "../../../data/publicProfiles";
import { useCards } from "../../../hooks/useCard";
import { useCardArtCrop } from "../../../hooks/useCardImage";
import reduxAction from "../../../redux/reduxAction";
import compareCards from "../../../utils/compareCards";
import copyToClipboard from "../../../utils/copyToClipboard";
import { toMMSS } from "../../../utils/dateTo";
import getEventPrettyName from "../../../utils/getEventPrettyName";
import getPlayerNameWithoutSuffix from "../../../utils/getPlayerNameWithoutSuffix";
import isLimitedEventId from "../../../utils/isLimitedEventId";
import Colors from "../../../utils/mtga/colors";
import Deck from "../../../utils/mtga/deck";
import ActionLogV2 from "../../action-log-v2";
import { ActionLogV2 as ActionLogV2Type } from "../../action-log-v2/types";
import ActionLog from "../../ActionLog";
import DeckColorsBar from "../../DeckColorsBar";
import DeckList from "../../DeckList";
import Flex from "../../Flex";
import ManaCost from "../../ManaCost";
import RankIcon from "../../RankIcon";
import SvgButton from "../../SvgButton";
import Button from "../../ui/Button";
import Section from "../../ui/Section";

interface PublicMatchViewProps {
  profileId: string;
  matchId: string;
}

/**
 * The public view of one match, opened from a profile's match list. Shows
 * the deck the player ran, the result, event and both ranks — mirroring the
 * private match view's layout without its private parts (opponent name,
 * action log, per-game telemetry).
 */
export default function PublicMatchView({
  profileId,
  matchId,
}: PublicMatchViewProps): JSX.Element {
  const history = useHistory();
  const dispatch = useDispatch();

  const [match, setMatch] = useState<PublicMatch | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setMatch(null);
    setMissing(false);
    let cancelled = false;
    // Same two-step resolution as the profile: the id is usually an arena
    // persona id, but /profile/<username> links exist too.
    getPublicMatch(matchId, { arenaId: profileId })
      .then((m) => m ?? getPublicMatch(matchId, { username: profileId }))
      .then((m) => {
        if (cancelled) return;
        if (m) setMatch(m);
        else setMissing(true);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId, matchId]);

  const snapshot = match?.player_deck;

  // Prefetch the whole list so DeckList and the charts do not render blank
  // on a cold public page (same fix as the shared-deck view).
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
    d.tile = snapshot?.deckTileId || 0;
    return d;
    // resolvedCards is the point: DeckList reads from the card cache, which
    // is only warm once these lookups come back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, resolvedCards]);

  const deckArt = useCardArtCrop(snapshot?.deckTileId || 0);

  const arenaExport = (): void => {
    // A fresh Deck: sorting in place would reorder the memoized one the
    // page is rendering.
    const exportDeck = new Deck(
      {},
      snapshot?.mainDeck || [],
      snapshot?.sideboard || []
    );
    exportDeck.sortMainboard(compareCards);
    exportDeck.sortSideboard(compareCards);
    copyToClipboard(exportDeck.getExportArena());
    reduxAction(dispatch, {
      type: "SET_POPUP",
      arg: {
        text: "Deck copied to clipboard.",
        duration: 5000,
        time: new Date().getTime(),
      },
    });
  };

  if (missing) {
    return (
      <div className="profile-view">
        <Section
          style={{
            marginTop: "16px",
            padding: "48px",
            flexDirection: "column",
            textAlign: "center",
          }}
        >
          <div style={{ color: "var(--color-text-dark)" }}>
            This match is not available.
          </div>
        </Section>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="profile-view">
        <Section style={{ marginTop: "16px", padding: "48px" }}>
          <div className="loading-sign" style={{ margin: "auto" }} />
        </Section>
      </div>
    );
  }

  const isLimited = isLimitedEventId(match.event_id);
  const won = match.player_wins > match.player_losses;

  return (
    <div className="profile-view">
      <div
        className="matches-top"
        style={{
          backgroundImage: deckArt ? `url("${deckArt}")` : undefined,
        }}
      >
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
            <ManaCost className="manaS20" colors={deck.getColors().get()} />
          </div>
        </div>
      </div>

      <Section
        style={{
          lineHeight: "36px",
          padding: "16px",
          margin: "16px 0 0",
          justifyContent: "space-between",
        }}
      >
        <Flex>
          <IconCrown
            style={{ margin: "auto 16px auto 8px" }}
            fill="var(--color-icon)"
          />
          <div
            className="match-top-result"
            style={{ color: `var(--color-${won ? "g" : "r"})` }}
          >
            {`${match.player_wins}-${match.player_losses}`}
          </div>
        </Flex>
        <Flex>
          <IconEvent
            style={{ margin: "auto 16px auto 8px" }}
            fill="var(--color-icon)"
          />
          <div>{getEventPrettyName(match.event_id)}</div>
        </Flex>
        <Flex>
          <IconTime
            style={{ margin: "auto 16px auto 8px" }}
            fill="var(--color-icon)"
          />
          <div>{toMMSS(match.duration || 0)}</div>
        </Flex>
        <Button
          style={{ width: "auto", padding: "0 10px" }}
          onClick={arenaExport}
          text="Export to Arena"
        />
      </Section>

      <Section
        style={{
          padding: "16px",
          margin: "16px 0 0",
          maxHeight: "48px",
          justifyContent: "space-between",
        }}
      >
        <div className="match-player-name">
          {`vs ${
            match.opp_name
              ? getPlayerNameWithoutSuffix(match.opp_name)
              : "Opponent"
          }`}
        </div>
        {match.opp_rank?.rank ? (
          <RankIcon
            rank={match.opp_rank.rank}
            tier={match.opp_rank.tier ?? 0}
            percentile={match.opp_rank.percentile || 0}
            leaderboardPlace={match.opp_rank.leaderboardPlace || 0}
            format={isLimited ? "limited" : "constructed"}
          />
        ) : null}
        <Flex>
          <ManaCost
            colors={new Colors().addFromBits(match.opp_deck_colors || 0).get()}
          />
        </Flex>
      </Section>

      <div className={`public-match-grid${match.action_log ? "" : " no-log"}`}>
        <Section
          style={{
            padding: "16px",
            flexDirection: "column",
          }}
        >
          <DeckList deck={deck} showWildcards={false} />
        </Section>
        {match.action_log ? (
          <Section
            style={{
              padding: "16px",
              flexDirection: "column",
            }}
          >
            {typeof match.action_log === "string" ? (
              <ActionLog logStr={match.action_log} />
            ) : (
              <ActionLogV2
                actionLog={match.action_log as unknown as ActionLogV2Type}
              />
            )}
          </Section>
        ) : null}
      </div>
    </div>
  );
}
