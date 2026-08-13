import _ from "lodash";
import { useMemo } from "react";

import { DEFAULT_TILE } from "../../../constants";
import { PlayerMatchRow } from "../../../data/publicProfiles";
import { useCards } from "../../../hooks/useCard";
import { toMMSS } from "../../../utils/dateTo";
import getEventPrettyName from "../../../utils/getEventPrettyName";
import getPlayerNameWithoutSuffix from "../../../utils/getPlayerNameWithoutSuffix";
import isLimitedEventId from "../../../utils/isLimitedEventId";
import Colors from "../../../utils/mtga/colors";
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
import RankSmall from "../../RankSmall";

interface ProfileListItemMatchProps {
  row: PlayerMatchRow;
  openMatchCallback: (row: PlayerMatchRow) => void;
}

/**
 * A public profile's match row, styled like the History tab's ListItemMatch.
 * Differs where the data must: no upload/delete controls, and the opponent
 * side shows rank and colors but never a name.
 */
export default function ProfileListItemMatch({
  row,
  openMatchCallback,
}: ProfileListItemMatchProps): JSX.Element {
  const isLimited = isLimitedEventId(row.event_id || "");
  const won = row.player_wins > row.player_losses;

  // Draft decks carry the stock tile; borrow the deck's first mythic — or
  // failing that, first rare — for art, exactly like the History tab.
  const rawTileId = row.deck_tile_id ?? 0;
  const deckTileId = rawTileId === DEFAULT_TILE ? 0 : rawTileId;
  const fallbackIds = useMemo(
    () => (deckTileId ? [] : _.uniq(row.fallback_ids ?? [])),
    [deckTileId, row.fallback_ids]
  );
  const fallbackCards = useCards(fallbackIds);
  const fallbackTile = useMemo(() => {
    const mythic = fallbackCards.find((c) => c?.Rarity === "mythic");
    const rare = fallbackCards.find((c) => c?.Rarity === "rare");
    return (mythic ?? rare)?.GrpId;
  }, [fallbackCards]);

  return (
    <ListItem click={(): void => openMatchCallback(row)}>
      <div
        className="list-item-left-indicator"
        style={{
          backgroundColor: won ? `var(--color-g)` : `var(--color-r)`,
        }}
      />
      <HoverTile grpId={deckTileId || fallbackTile || DEFAULT_TILE}>
        {row.player_rank?.rank ? (
          <RankIcon
            rank={row.player_rank.rank}
            tier={row.player_rank.tier ?? 0}
            percentile={row.player_rank.percentile || 0}
            leaderboardPlace={row.player_rank.leaderboardPlace || 0}
            format={isLimited ? "limited" : "constructed"}
          />
        ) : null}
      </HoverTile>

      <Column className="list-item-left">
        <FlexTop>
          <div className="list-deck-name">{row.deck_name || ""}</div>
          <div className="list-deck-name-it">
            {getEventPrettyName(row.event_id || "")}
          </div>
        </FlexTop>
        <FlexBottom>
          <ManaCost
            className="mana-s20"
            colors={new Colors().addFromBits(row.player_deck_colors || 0).get()}
          />
          <div
            style={{
              lineHeight: "30px",
              marginLeft: "4px",
              marginRight: "auto",
            }}
            className="list-match-time"
          >
            <div className="time">
              {row.played_at
                ? timeAgo(new Date(row.played_at).getTime())
                : "\u2014"}
            </div>{" "}
            {`${toMMSS(row.duration || 0)} long`}
          </div>
        </FlexBottom>
      </Column>

      <Column className="list-item-center">
        <></>
      </Column>

      <Column className="list-item-right">
        <FlexTop>
          <div className="list-match-title">
            {`vs ${
              row.opp_name
                ? getPlayerNameWithoutSuffix(row.opp_name)
                : "Opponent"
            }`}
          </div>
          <RankSmall
            rank={{
              rank: row.opp_rank?.rank || "Unranked",
              tier: row.opp_rank?.tier ?? 0,
              step: row.opp_rank?.step || 0,
              won: 0,
              lost: 0,
              drawn: 0,
              seasonOrdinal: 0,
              percentile: row.opp_rank?.percentile || 0,
              leaderboardPlace: row.opp_rank?.leaderboardPlace || 0,
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
            colors={new Colors().addFromBits(row.opp_deck_colors || 0).get()}
          />
        </FlexBottom>
      </Column>

      <Column className="list-match-result">
        <div className={won ? "green" : "red"}>
          {row.player_wins}:{row.player_losses}
        </div>
      </Column>
    </ListItem>
  );
}
