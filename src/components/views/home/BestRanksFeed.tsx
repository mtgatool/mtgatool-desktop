import { useEffect, useState } from "react";
import { DEFAULT_AVATAR } from "../../../constants";
import timeAgo from "../../../utils/timeAgo";

import RankIcon from "../../RankIcon";

import DbRankInfo from "./DbRankInfo";
import { sortConstructedRanks, sortLimitedRanks } from "./sortRanks";

function DrawConstructedRank(props: DbRankInfo) {
  const {
    updated,
    name,
    avatar,
    constructedClass,
    constructedLevel,
    constructedStep,
    constructedPercentile,
    constructedLeaderboardPlace,
  } = props;

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
        <div className="rank-name">{name || "-"}</div>
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
    limitedClass,
    limitedLevel,
    limitedStep,
    limitedPercentile,
    limitedLeaderboardPlace,
  } = props;

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
        <div className="rank-name">{name || "-"}</div>
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

  /**
   * This does not scale well.
   * We should probably use a cache entry on the database to store these,
   * It could be an array of the top 10 ranks or something compact, once every month for
   * consistency with the MTGA ladder.
   * Also we should check for dates timestamps.
   */
  useEffect(() => {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);

    window.toolDb
      .queryKeys("rank-MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE")
      .then((keys) => {
        if (keys) {
          const promises = keys.map((k) =>
            window.toolDb.getData(k).then((d) =>
              window.toolDb.getData(`:${d.pubKey}.avatar`).then((avatar) =>
                window.toolDb.getData(`:${d.pubKey}.username`).then((name) => {
                  return {
                    ...d,
                    avatar,
                    name,
                  };
                })
              )
            )
          );
          Promise.all(promises)
            .then((data: DbRankInfo[]) => {
              setAllRanks(
                // filter out data from last week only
                data.filter((r) => r.updated > firstDay.getTime())
              );
            })
            .catch((err) => {
              console.log(err);
            });
        }
      });
  }, []);

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
