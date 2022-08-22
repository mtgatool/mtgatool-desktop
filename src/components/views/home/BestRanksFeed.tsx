import { useEffect, useState } from "react";
import { DEFAULT_AVATAR } from "../../../constants";

import RankIcon from "../../RankIcon";

import DbRankInfo from "./DbRankInfo";
import { sortConstructedRanks, sortLimitedRanks } from "./sortRanks";

function DrawConstructedRank(props: DbRankInfo) {
  const {
    name,
    avatar,
    constructedClass,
    constructedLevel,
    constructedStep,
    constructedPercentile,
    constructedLeaderboardPlace,
  } = props;

  return (
    <div className="feed-rank-listitem">
      <div
        className="rank-avatar"
        style={{
          backgroundImage: `url(${avatar || DEFAULT_AVATAR})`,
        }}
      />
      <div className="rank-name">{name}</div>
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
  );
}

function DrawLimitedRank(props: DbRankInfo) {
  const {
    name,
    avatar,
    limitedClass,
    limitedLevel,
    limitedStep,
    limitedPercentile,
    limitedLeaderboardPlace,
  } = props;

  return (
    <div className="feed-rank-listitem">
      <div
        className="rank-avatar"
        style={{
          backgroundImage: `url(${avatar || DEFAULT_AVATAR})`,
        }}
      />
      <div className="rank-name">{name}</div>
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
  );
}

export default function BestRanksFeed() {
  const [allRanks, setAllRanks] = useState<DbRankInfo[]>([]);

  useEffect(() => {
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
            .then((data: any[]) => {
              setAllRanks(data);
            })
            .catch((err) => {
              console.log(err);
            });
        }
      });
  }, []);

  const bestConstructed = allRanks.sort(sortConstructedRanks).slice(0, 5);

  const bestLimited = allRanks.sort(sortLimitedRanks).slice(0, 5);

  return (
    <div className="ranks-feed-container">
      <div className="ranks-feed-column">
        <h3>Constructed</h3>
        {bestConstructed.map(DrawConstructedRank)}
      </div>
      <div className="ranks-feed-column">
        <h3>Limited</h3>
        {bestLimited.map(DrawLimitedRank)}
      </div>
    </div>
  );
}
