import { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";

import { DEFAULT_AVATAR } from "../../../constants";
import { getLatestRanks } from "../../../data/publicProfiles";
import cleanUsername from "../../../utils/cleanUsername";
import timeAgo from "../../../utils/timeAgo";
import RankIcon from "../../RankIcon";
import DbRankInfo from "./DbRankInfo";
import { sortConstructedRanks, sortLimitedRanks } from "./sortRanks";

function DrawConstructedRank(props: DbRankInfo) {
  const {
    updated,
    name,
    avatar,
    pubKey,
    constructedClass,
    constructedLevel,
    constructedStep,
    constructedPercentile,
    constructedLeaderboardPlace,
  } = props;

  const history = useHistory();

  const mythicRankTitle =
    constructedLeaderboardPlace == 0
      ? ` ${(constructedPercentile || 0).toFixed(2)}%`
      : ` #${constructedLeaderboardPlace}`;

  return (
    <div className="list-item-container-nohover feed-rank-listitem">
      <div
        className="rank-avatar"
        style={{
          backgroundImage: `url(${avatar || DEFAULT_AVATAR})`,
        }}
      />
      <div className="rank-name-container">
        <div
          className="rank-name"
          onClick={() => history.push(`/user/${encodeURIComponent(pubKey)}`)}
        >
          {cleanUsername(name || "-")}
        </div>
        <div className="rank-time">{timeAgo(updated)}</div>
      </div>
      <div className="rank-icon">
        <div className="rank-position">
          {constructedClass === "Mythic" ? mythicRankTitle : ""}
        </div>
        <RankIcon
          rank={constructedClass}
          tier={constructedLevel}
          step={constructedStep}
          percentile={constructedPercentile}
          leaderboardPlace={constructedLeaderboardPlace}
          format="constructed"
          style={{ margin: "auto 0" }}
        />
      </div>
    </div>
  );
}

function DrawLimitedRank(props: DbRankInfo) {
  const {
    updated,
    name,
    avatar,
    pubKey,
    limitedClass,
    limitedLevel,
    limitedStep,
    limitedPercentile,
    limitedLeaderboardPlace,
  } = props;

  const history = useHistory();

  const mythicRankTitle =
    limitedLeaderboardPlace == 0
      ? ` ${(limitedPercentile || 0).toFixed(2)}%`
      : ` #${limitedLeaderboardPlace}`;

  return (
    <div className="list-item-container-nohover feed-rank-listitem">
      <div
        className="rank-avatar"
        style={{
          backgroundImage: `url(${avatar || DEFAULT_AVATAR})`,
        }}
      />
      <div className="rank-name-container">
        <div
          className="rank-name"
          onClick={() => history.push(`/user/${encodeURIComponent(pubKey)}`)}
        >
          {name || "-"}
        </div>
        <div className="rank-time">{timeAgo(updated)}</div>
      </div>
      <div className="rank-icon">
        <div className="rank-position">
          {limitedClass === "Mythic" ? mythicRankTitle : ""}
        </div>
        <RankIcon
          rank={limitedClass}
          tier={limitedLevel}
          step={limitedStep}
          percentile={limitedPercentile}
          leaderboardPlace={limitedLeaderboardPlace}
          format="limited"
          style={{ margin: "auto 0" }}
        />
      </div>
    </div>
  );
}

function DrawLoadingRank() {
  return (
    <div className="list-item-container-nohover feed-rank-listitem loading" />
  );
}

const emptyList = new Array(8).fill(0);

export default function BestRanksFeed() {
  const [allRanks, setAllRanks] = useState<DbRankInfo[]>([]);

  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    // Public latest ranks across users (name + avatar resolved server-side,
    // private-mode users excluded). See data/publicProfiles.ts.
    getLatestRanks(200).then((ranks) => setAllRanks(ranks));
  }, [isLoadingRef]);

  const bestConstructed = allRanks.sort(sortConstructedRanks).slice(0, 8);

  const bestLimited = allRanks.sort(sortLimitedRanks).slice(0, 8);

  return (
    <div className="ranks-feed-container">
      <div className="ranks-feed-column">
        <h3>Constructed</h3>
        {allRanks.length === 0
          ? emptyList.map(DrawLoadingRank)
          : bestConstructed
              .map((r) => {
                return {
                  ...r,
                  key: `constructed-best-${r.uuid}`,
                };
              })
              .map(DrawConstructedRank)}
      </div>
      <div className="ranks-feed-column">
        <h3>Limited</h3>
        {allRanks.length === 0
          ? emptyList.map(DrawLoadingRank)
          : bestLimited
              .map((r) => {
                return {
                  ...r,
                  key: `limited-best-${r.uuid}`,
                };
              })
              .map(DrawLimitedRank)}
      </div>
    </div>
  );
}
