import _ from "lodash";
import {
  Colors,
  constants,
  getEventPrettyName,
  InternalMatch,
} from "mtgatool-shared";

import {
  Column,
  FlexBottom,
  FlexTop,
  HoverTile,
  ListItem,
} from "../../ListItem";
import copyToClipboard from "../../../utils/copyToClipboard";
import ManaCost from "../../ManaCost";
import { toMMSS } from "../../../utils/dateTo";
import RankSmall from "../../RankSmall";
import ResultDetails from "../../ResultDetails";
import { GunMatch } from "../../../types/gunTypes";
import baseToObj from "../../../utils/baseToObj";
import timeAgo from "../../../utils/timeAgo";

const { DEFAULT_TILE } = constants;

interface ListItemMatchProps {
  match: GunMatch;
  openMatchCallback: (match: InternalMatch) => void;
}

export default function ListItemMatch({
  match,
  openMatchCallback,
}: ListItemMatchProps): JSX.Element {
  const internalMatch = baseToObj<InternalMatch>(match.internalMatch);

  const onRowClick = (): void => {
    openMatchCallback(internalMatch);
  };

  let dateTime = new Date(match.timestamp);
  // Quick hack to check if NaN
  // eslint-disable-next-line no-self-compare
  if (dateTime.getTime() !== dateTime.getTime()) {
    dateTime = new Date();
  }

  // const isLimited = database.limited_ranked_events.includes(match.eventId);

  return (
    <ListItem click={onRowClick}>
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
        {/* <RankIcon
          rank={match.player.rank}
          tier={match.player.tier}
          percentile={match.player.percentile || 0}
          leaderboardPlace={match.player.leaderboardPlace || 0}
          format={isLimited ? "limited" : "constructed"}
        /> */}
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
        <FlexTop>
          <div className="list-match-title">
            {`vs ${internalMatch.opponent.name.slice(0, -6)}`}
          </div>
          <div
            onClick={(
              e: React.MouseEvent<HTMLDivElement, MouseEvent>
            ): void => {
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              copyToClipboard(internalMatch.opponent.name);
            }}
            className="copy-button"
          />
          <RankSmall rank={internalMatch.opponent} />
        </FlexTop>
        <FlexBottom
          style={{
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <ManaCost
            className="mana-s20"
            colors={internalMatch.oppDeck.colors || []}
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
