import { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";

import { DEFAULT_AVATAR } from "../../../constants";
import useFetchAvatar from "../../../hooks/useFetchAvatar";
import useFetchUsername from "../../../hooks/useFetchUsername";
import { DbRankDataWithKey } from "../../../types/dbTypes";
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

// Promise utility that will resolve to undefined if the promise fails
// Used to avoid Promise.all() to fail if one of the promises fails
function finallyThen<T>(param: Promise<T>) {
  return param
    .then((res) => {
      return res;
    })
    .catch(() => {
      return undefined;
    });
}

const emptyList = new Array(8).fill(0);

export default function BestRanksFeed() {
  const [allRanks, setAllRanks] = useState<DbRankInfo[]>([]);

  const isLoadingRef = useRef(false);

  const fetchAvatar = useFetchAvatar();
  const fetchUsername = useFetchUsername();

  useEffect(() => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    window.toolDb
      .doFunction<DbRankDataWithKey[]>("getLatestRanks", {})
      .then((fnRet) => {
        const data: DbRankDataWithKey[] =
          fnRet.code === "OK" && fnRet.return ? fnRet.return : [];

        const promises = data.map((rankInfo) =>
          finallyThen(fetchAvatar(rankInfo.pubKey)).then((avatar) =>
            finallyThen(fetchUsername(rankInfo.pubKey)).then((name) => {
              console.log("rankInfo", name, avatar?.slice(0, 10));
              return {
                ...rankInfo,
                pubKey: rankInfo.pubKey,
                avatar: avatar || DEFAULT_AVATAR,
                name: name || "",
              };
            })
          )
        );

        Promise.all(promises).then((ranks) => {
          console.log("ranks", ranks);
          setAllRanks(ranks);
        });
      });
  }, [isLoadingRef, fetchAvatar, fetchUsername]);

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
