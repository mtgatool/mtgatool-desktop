import _ from "lodash";
import { Colors, constants } from "mtgatool-shared";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import useFetchAvatar from "../../../hooks/useFetchAvatar";
import useFetchUsername from "../../../hooks/useFetchUsername";
import { AppState } from "../../../redux/stores/rendererStore";
import { toMMSS } from "../../../utils/dateTo";
import getEventPrettyName from "../../../utils/getEventPrettyName";
import isLimitedEventId from "../../../utils/isLimitedEventId";
import timeAgo from "../../../utils/timeAgo";
import {
  Column,
  FlexBottom,
  FlexTop,
  HoverTile,
  ListItem,
} from "../../ListItem";
import ManaCost from "../../ManaCost";
import RankIcon from "../../RankIcon";
import ResultDetails from "../../ResultDetails";
import { MatchData } from "../history/convertDbMatchData";

const { DEFAULT_TILE } = constants;

interface ListItemMatchProps {
  match: MatchData;
  pubKey: string;
}

export default function LiveFeedMatch({
  match,
  pubKey,
}: ListItemMatchProps): JSX.Element {
  const { internalMatch } = match;
  const history = useHistory();

  const avatars = useSelector((state: AppState) => state.avatars.avatars);
  const usernames = useSelector((state: AppState) => state.usernames.usernames);

  const fetchAvatar = useFetchAvatar();
  const fetchUsername = useFetchUsername();

  let dateTime = new Date(match.timestamp);
  // Quick hack to check if NaN
  // eslint-disable-next-line no-self-compare
  if (dateTime.getTime() !== dateTime.getTime()) {
    dateTime = new Date();
  }

  useEffect(() => {
    fetchAvatar(pubKey);
    fetchUsername(pubKey);
  }, [pubKey]);

  const isLimited = isLimitedEventId(match.eventId);

  const username = usernames[pubKey || ""];
  const avatar = avatars[pubKey || ""];

  return (
    <ListItem>
      <div
        className="list-item-left-indicator"
        style={{
          backgroundColor:
            match.playerWins > match.playerLosses
              ? `var(--color-g)`
              : `var(--color-r)`,
          position: "relative",
        }}
      >
        {avatar ? (
          <div
            title={username}
            className="livefeed-avatar"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              history.push(`/user/${encodeURIComponent(pubKey)}`);
            }}
            style={{
              backgroundImage: `url(${avatar})`,
            }}
          />
        ) : null}
      </div>
      <HoverTile grpId={internalMatch.playerDeck.deckTileId || DEFAULT_TILE}>
        {internalMatch.player.rank ? (
          <RankIcon
            rank={internalMatch.player.rank}
            tier={internalMatch.player.tier}
            percentile={internalMatch.player.percentile || 0}
            leaderboardPlace={internalMatch.player.leaderboardPlace || 0}
            format={isLimited ? "limited" : "constructed"}
          />
        ) : (
          <></>
        )}
      </HoverTile>

      <Column className="list-item-left">
        <FlexTop>
          <div className="list-deck-name">
            {internalMatch.playerDeck.name || ""}
          </div>
          <div className="list-deck-name-it">
            {getEventPrettyName(match.eventId)}
          </div>
        </FlexTop>
        <FlexBottom>
          <ManaCost
            className="mana-s20"
            colors={new Colors().addFromBits(match.playerDeckColors).get() || 0}
          />
          <div
            style={{
              lineHeight: "30px",
              marginLeft: "4px",
              marginRight: "auto",
            }}
            className="list-match-time"
          >
            <div className="time">{timeAgo(match.timestamp)}</div>{" "}
            {`${toMMSS(match.duration)} long`}
          </div>
        </FlexBottom>
      </Column>

      <Column className="list-item-center">{}</Column>

      <Column className="list-item-right">
        <FlexBottom
          style={{
            margin: "auto",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <div className="list-deck-name-it" style={{ margin: "6px" }}>
            vs
          </div>
          <ManaCost
            className="mana-s20"
            colors={new Colors()
              .addFromBits(internalMatch.oppDeck.colors || 0)
              .get()}
          />
        </FlexBottom>
      </Column>

      <ResultDetails match={internalMatch} />

      <Column className="list-match-result">
        <div
          className={match.playerWins > match.playerLosses ? "green" : "red"}
        >
          {match.playerWins}:{match.playerLosses}
        </div>
      </Column>
    </ListItem>
  );
}
