import _ from "lodash";
import { Colors, constants, getEventPrettyName } from "mtgatool-shared";

import {
  Column,
  FlexBottom,
  FlexTop,
  HoverTile,
  ListItem,
} from "../../ListItem";

import ManaCost from "../../ManaCost";
import { toMMSS } from "../../../utils/dateTo";

import ResultDetails from "../../ResultDetails";
import timeAgo from "../../../utils/timeAgo";
import RankIcon from "../../RankIcon";
import isLimitedEventId from "../../../utils/isLimitedEventId";
import { MatchData } from "../history/getMatchesData";

const { DEFAULT_TILE } = constants;

interface ListItemMatchProps {
  match: MatchData;
}

export default function LiveFeedMatch({
  match,
}: ListItemMatchProps): JSX.Element {
  const { internalMatch } = match;

  let dateTime = new Date(match.timestamp);
  // Quick hack to check if NaN
  // eslint-disable-next-line no-self-compare
  if (dateTime.getTime() !== dateTime.getTime()) {
    dateTime = new Date();
  }

  const isLimited = isLimitedEventId(match.eventId);

  return (
    <ListItem>
      <div
        className="list-item-left-indicator"
        style={{
          backgroundColor:
            match.playerWins > match.playerLosses
              ? `var(--color-g)`
              : `var(--color-r)`,
        }}
      />
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
