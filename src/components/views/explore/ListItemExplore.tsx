/* eslint-disable radix */
/* eslint-disable no-bitwise */
import _ from "lodash";
import {
  CardsList,
  Colors,
  constants,
  database,
  Deck,
  formatPercent,
} from "mtgatool-shared";

import {
  Column,
  FlexBottom,
  FlexTop,
  HoverTile,
  ListItem,
} from "../../ListItem";

import ManaCost from "../../ManaCost";
import { toMMSS } from "../../../utils/dateTo";
import RankSmall from "../../RankSmall";

import { ExploreDeckData } from "./doExploreAggregation";
import getPlayerNameWithoutSuffix from "../../../utils/getPlayerNameWithoutSuffix";
import getWinrateClass from "../../../utils/getWinrateClass";
import {
  RANK_BRONZE,
  RANK_DIAMOND,
  RANK_GOLD,
  RANK_MYTHIC,
  RANK_PLATINUM,
  RANK_SILVER,
} from "../history/getRankFilterVal";
import WildcardsCostPreset from "../../WildcardsCostPreset";

// import getDeckRaritiesCount from "../../../utils/getDeckRaritiesCount";
import getWildcardsMissing from "../../../utils/getWildcardsMissing";

const { DEFAULT_TILE } = constants;

function getRankBitsAsArray(bits: number) {
  const arr = [];
  if (bits & RANK_BRONZE) arr.push("Bronze");
  if (bits & RANK_SILVER) arr.push("Silver");
  if (bits & RANK_GOLD) arr.push("Gold");
  if (bits & RANK_PLATINUM) arr.push("Platinum");
  if (bits & RANK_DIAMOND) arr.push("Diamond");
  if (bits & RANK_MYTHIC) arr.push("Mythic");
  return arr;
}

interface ListItemMatchProps {
  data: ExploreDeckData;
  openExploreDeckCallback?: (data: ExploreDeckData) => void;
}

export default function ListItemExplore({
  data,
  openExploreDeckCallback,
}: ListItemMatchProps): JSX.Element {
  const onRowClick = (): void => {
    if (openExploreDeckCallback) {
      openExploreDeckCallback(data);
    }
  };

  const wildcards = {
    c: 0,
    u: 0,
    r: 0,
    m: 0,
  };

  let totalWildcardsMissing = 0;

  const decklist = new Deck();
  decklist.setMainboard(new CardsList(data.deck));
  // const wildcards = getDeckRaritiesCount(decklist);
  data.deck.forEach((c) => {
    const card = database.card(c.grpId || c.id);
    if (card) {
      const missing = getWildcardsMissing(decklist, c.grpId || c.id, false);
      if (missing > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        totalWildcardsMissing += missing;
        if (card.rarity === "common") wildcards.c += missing;
        if (card.rarity === "uncommon") wildcards.u += missing;
        if (card.rarity === "rare") wildcards.r += missing;
        if (card.rarity === "mythic") wildcards.m += missing;
      }
    }
  });

  const winrate =
    data.wins + data.losses > 0
      ? (1 / (data.wins + data.losses)) * data.wins
      : 0;

  return (
    <ListItem click={openExploreDeckCallback ? onRowClick : undefined}>
      <HoverTile grpId={data.tile || DEFAULT_TILE} />

      <Column className="list-item-left">
        <FlexTop>
          <div className="list-deck-name">{data.name || ""}</div>
        </FlexTop>
        <FlexBottom>
          <ManaCost
            className="mana-s20"
            colors={new Colors().addFromBits(data.colors).get() || 0}
          />
          <div
            style={{
              lineHeight: "30px",
              marginLeft: "8px",
              marginRight: "auto",
            }}
            className="list-match-time"
          >{`by ${
            data.pilots.length === 1
              ? getPlayerNameWithoutSuffix(data.pilots[0])
              : `${data.pilots.length} players`
          }`}</div>
        </FlexBottom>
      </Column>

      <Column className="list-item-center">
        <WildcardsCostPreset showComplete wildcards={wildcards} />
      </Column>

      <Column className="list-item-right">
        <FlexTop style={{ margin: "auto 8px auto auto" }}>
          {getRankBitsAsArray(data.ranks).map((r) => {
            return (
              <RankSmall
                key={`${r}-r`}
                rank={{
                  rank: r,
                  tier: 1,
                  step: 0,
                  won: 0,
                  lost: 0,
                  drawn: 0,
                  seasonOrdinal: 0,
                  percentile: 0,
                  leaderboardPlace: 0,
                }}
              />
            );
          })}
        </FlexTop>
        <FlexBottom
          style={{
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              lineHeight: "30px",
              marginLeft: "auto",
              marginRight: "8px",
            }}
            className="list-match-time"
          >
            {`avg. time: ${toMMSS(Math.round(data.avgDuration))}`}
          </div>
        </FlexBottom>
      </Column>

      <Column
        className="list-match-result-score"
        style={{ width: "120px", textAlign: "right", fontSize: "18px" }}
      >
        <div>
          {data.wins}:{data.losses}
          <span
            style={{ marginLeft: "8px" }}
            className={getWinrateClass(winrate, true)}
          >
            ({formatPercent(winrate)})
          </span>
        </div>
      </Column>
    </ListItem>
  );
}
