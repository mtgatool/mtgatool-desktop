import _ from "lodash";
import { useMemo } from "react";
import { useSelector } from "react-redux";

import { ReactComponent as IconUpload } from "../../../assets/images/svg/upload.svg";
import { DEFAULT_TILE } from "../../../constants";
import setDbMatch from "../../../data/setDbMatch";
import { LOCAL_KEY } from "../../../data/store";
import { useCards } from "../../../hooks/useCard";
import { AppState } from "../../../redux/stores/rendererStore";
import copyToClipboard from "../../../utils/copyToClipboard";
import { toMMSS } from "../../../utils/dateTo";
import getEventPrettyName from "../../../utils/getEventPrettyName";
import getPlayerNameWithoutSuffix from "../../../utils/getPlayerNameWithoutSuffix";
import isLimitedEventId from "../../../utils/isLimitedEventId";
import Colors from "../../../utils/mtga/colors";
import timeAgo from "../../../utils/timeAgo";
import {
  Column,
  DeleteButton,
  FlexBottom,
  FlexTop,
  HoverTile,
  ListItem,
} from "../../ListItem";
import ManaCost from "../../ManaCost";
import RankIcon from "../../RankIcon";
import RankSmall from "../../RankSmall";
import ResultDetails from "../../ResultDetails";
import { MatchData } from "./convertDbMatchData";

interface ListItemMatchProps {
  match: MatchData;
  openMatchCallback?: (match: MatchData) => void;
  deleteMatchCallback?: (match: MatchData) => void;
}

export default function ListItemMatch({
  match,
  openMatchCallback,
  deleteMatchCallback,
}: ListItemMatchProps): JSX.Element {
  const { internalMatch } = match;

  const remoteMatchesIndex = useSelector(
    (state: AppState) => state.mainData.remoteMatchesIndex
  );

  const matchKey = `:${LOCAL_KEY}.matches-${match.matchId}`;

  const onRowClick = (): void => {
    if (openMatchCallback) {
      openMatchCallback(match);
    }
  };

  let dateTime = new Date(match.timestamp);
  // Quick hack to check if NaN
  // eslint-disable-next-line no-self-compare
  if (dateTime.getTime() !== dateTime.getTime()) {
    dateTime = new Date();
  }

  const isLimited = isLimitedEventId(match.eventId);

  // Draft decks carry no tile art of their own — Arena stamps them with the
  // stock tile (DEFAULT_TILE, not 0). Borrow the deck's first mythic — or
  // failing that, first rare — instead of showing that default on every
  // limited match.
  const rawTileId = internalMatch.playerDeck.deckTileId;
  const deckTileId = rawTileId === DEFAULT_TILE ? 0 : rawTileId;
  const fallbackIds = useMemo(
    () =>
      deckTileId
        ? []
        : _.uniq((internalMatch.playerDeck.mainDeck ?? []).map((c) => c.id)),
    [deckTileId, internalMatch]
  );
  const fallbackCards = useCards(fallbackIds);
  const fallbackTile = useMemo(() => {
    const mythic = fallbackCards.find((c) => c?.Rarity === "mythic");
    const rare = fallbackCards.find((c) => c?.Rarity === "rare");
    return (mythic ?? rare)?.GrpId;
  }, [fallbackCards]);

  function uploadMatch(): void {
    setDbMatch(match.internalMatch);
  }

  return (
    <ListItem click={openMatchCallback ? onRowClick : undefined}>
      <div
        className="list-item-left-indicator"
        style={{
          backgroundColor:
            match.playerWins > match.playerLosses
              ? `var(--color-g)`
              : `var(--color-r)`,
        }}
      />
      <HoverTile grpId={deckTileId || fallbackTile || DEFAULT_TILE}>
        {!remoteMatchesIndex.includes(matchKey) ? (
          <IconUpload
            style={{
              margin: "auto auto auto 8px",
              width: "32px",
              height: "24px",
            }}
            onClick={(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void => {
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              uploadMatch();
            }}
            fill="#FFF"
          />
        ) : null}
        {internalMatch.player.rank ? (
          <RankIcon
            rank={internalMatch.player.rank}
            tier={internalMatch.player.tier}
            percentile={internalMatch.player.percentile || 0}
            leaderboardPlace={internalMatch.player.leaderboardPlace || 0}
            format={isLimited ? "limited" : "constructed"}
          />
        ) : null}
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

      <Column className="list-item-center">
        <></>
      </Column>

      <Column className="list-item-right">
        <FlexTop>
          <div className="list-match-title">
            {`vs ${getPlayerNameWithoutSuffix(internalMatch.opponent.name)}`}
          </div>
          <div
            onClick={(
              e: React.MouseEvent<HTMLDivElement, MouseEvent>
            ): void => {
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              copyToClipboard(internalMatch.opponent.name);
            }}
            className="copy-button-small"
          />
          <RankSmall
            rank={{
              rank: internalMatch.opponent.rank,
              tier: internalMatch.opponent.tier,
              step: internalMatch.opponent.step || 0,
              won: 0,
              lost: 0,
              drawn: 0,
              seasonOrdinal: 0,
              percentile: internalMatch.opponent.percentile || 0,
              leaderboardPlace: internalMatch.opponent.leaderboardPlace || 0,
            }}
          />
        </FlexTop>
        <FlexBottom
          style={{
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <ManaCost
            className="mana-s20"
            // Matches saved before the oppDeck colour write-back fix carry a
            // stale 0 inside the match; the column beside it was computed
            // correctly, so fall back to that.
            colors={new Colors()
              .addFromBits(
                internalMatch.oppDeck.colors || match.oppDeckColors || 0
              )
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

      {deleteMatchCallback ? (
        <DeleteButton
          dataId={match.matchId}
          deleteCallback={(): void => deleteMatchCallback(match)}
          title="delete match"
        />
      ) : null}
    </ListItem>
  );
}
