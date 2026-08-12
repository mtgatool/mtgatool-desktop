/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";

import { DEFAULT_AVATAR } from "../../../constants";
import { getLatestRanks } from "../../../data/publicProfiles";
import cleanUsername from "../../../utils/cleanUsername";
import RankIcon from "../../RankIcon";
import DbRankInfo from "./DbRankInfo";
import { sortConstructedRanks, sortLimitedRanks } from "./sortRanks";

function DrawConstructedRank(
  props: DbRankInfo & { pos: number; openProfile: (arenaId: string) => void }
) {
  const {
    pos,
    uuid,
    openProfile,
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
      <div className="rank-pos">{pos}</div>
      <div
        className="rank-avatar"
        style={{
          backgroundImage: `url(${avatar || DEFAULT_AVATAR})`,
        }}
      />
      <div className="rank-name-container">
        <div className="rank-name" onClick={() => openProfile(name || uuid)}>
          {cleanUsername(name || "-")}
        </div>
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

function DrawLimitedRank(
  props: DbRankInfo & { pos: number; openProfile: (arenaId: string) => void }
) {
  const {
    pos,
    uuid,
    openProfile,
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
      <div className="rank-pos">{pos}</div>
      <div
        className="rank-avatar"
        style={{
          backgroundImage: `url(${avatar || DEFAULT_AVATAR})`,
        }}
      />
      <div className="rank-name-container">
        <div className="rank-name" onClick={() => openProfile(name || uuid)}>
          {cleanUsername(name || "-")}
        </div>
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

const emptyList = new Array(10).fill(0);

export default function BestRanksFeed() {
  const history = useHistory();
  const [allRanks, setAllRanks] = useState<DbRankInfo[]>([]);

  // Prefer the username in the URL — /profile/manwe reads better and stays
  // stable across account switches; ViewProfile still resolves arena ids for
  // the rows that never made a profile.
  const openProfile = (id: string): void => {
    history.push(`/profile/${encodeURIComponent(id)}`);
  };

  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    // Public latest ranks across users (name + avatar resolved server-side,
    // private-mode users excluded). See data/publicProfiles.ts.
    getLatestRanks(200).then((ranks) => setAllRanks(ranks));
  }, [isLoadingRef]);

  const bestConstructed = [...allRanks].sort(sortConstructedRanks).slice(0, 10);

  const bestLimited = [...allRanks].sort(sortLimitedRanks).slice(0, 10);

  return (
    <div className="ranks-feed-container">
      <div className="ranks-feed-column">
        <h3>Constructed</h3>
        {allRanks.length === 0
          ? emptyList.map(DrawLoadingRank)
          : bestConstructed.map((r, i) => (
              <DrawConstructedRank
                key={`constructed-best-${r.uuid}`}
                pos={i + 1}
                openProfile={openProfile}
                {...r}
              />
            ))}
      </div>
      <div className="ranks-feed-column">
        <h3>Limited</h3>
        {allRanks.length === 0
          ? emptyList.map(DrawLoadingRank)
          : bestLimited.map((r, i) => (
              <DrawLimitedRank
                key={`limited-best-${r.uuid}`}
                pos={i + 1}
                openProfile={openProfile}
                {...r}
              />
            ))}
      </div>
    </div>
  );
}
