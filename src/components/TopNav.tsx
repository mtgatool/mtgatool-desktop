/* eslint-disable react/jsx-props-no-spreading */
import _ from "lodash";
import { getRankIndex, InternalRankData } from "mtgatool-shared";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useHistory, useLocation, useParams } from "react-router-dom";

import settingsIcon from "../assets/images/cog.png";
import { CombinedRankInfo } from "../background/onLabel/InEventGetCombinedRankInfo";
import useWindowSize from "../hooks/useWindowSize";
import { AppState } from "../redux/stores/rendererStore";
import { defaultRankData } from "../types/dbTypes";
import formatRank from "../utils/formatRank";
import getLocalSetting from "../utils/getLocalSetting";
import vodiFn from "../utils/voidfn";
import Alt from "./Alt";
import IconButton from "./ui/IconButton";

interface TopNavItemProps {
  compact: boolean;
  icon?: string;
  uri: string;
  title: string;
}

function TopNavItem(props: TopNavItemProps): JSX.Element {
  const { compact, icon, uri, title } = props;

  const params = useParams<{ page: string }>();
  const history = useHistory();

  return compact ? (
    <div
      className={`${params.page === uri ? "selected" : ""} item-compact`}
      onClick={() => history.push(`/${uri}`)}
    >
      <span className="item-text">{title}</span>
    </div>
  ) : (
    <div
      className={`${params.page === uri ? "selected" : ""} item ${
        title == "" ? " item-no-label" : ""
      }`}
      onClick={() => history.push(`/${uri}`)}
    >
      {title !== "" ? (
        <span className="item-text">{title}</span>
      ) : (
        <div className={`icon ${icon || ""}`} title={_.camelCase(title)} />
      )}
    </div>
  );
}

interface TopRankProps {
  uri: string;
  rank: CombinedRankInfo | null;
  rankClass: string;
  type: "constructed" | "limited";
}

function TopRankIcon(props: TopRankProps): JSX.Element {
  const closeAltRef = useRef<() => void>(vodiFn);
  const openAltRef = useRef<() => void>(vodiFn);
  const positionRef = useRef<HTMLDivElement>(null);

  const { uri, rank, rankClass, type } = props;

  const { pathname } = useLocation();
  const history = useHistory();

  const selected = pathname === uri;

  if (rank == null) {
    // No rank badge, default to beginner and remove interactions
    const rankStyle = {
      backgroundPosition: "0px 0px",
    };
    return (
      <div className="item">
        <div style={rankStyle} className={rankClass} />
      </div>
    );
  }

  let internalRank: InternalRankData = {
    rank: rank.constructedClass,
    tier: rank.constructedLevel,
    step: rank.constructedStep,
    won: rank.constructedMatchesWon,
    lost: rank.constructedMatchesLost,
    drawn: rank.constructedMatchesDrawn,
    percentile: rank.constructedPercentile,
    leaderboardPlace: rank.constructedLeaderboardPlace,
    seasonOrdinal: rank.constructedSeasonOrdinal,
  };

  if (type === "limited") {
    internalRank = {
      rank: rank.limitedClass,
      tier: rank.limitedLevel,
      step: rank.limitedStep,
      won: rank.limitedMatchesWon,
      lost: rank.limitedMatchesLost,
      drawn: rank.limitedMatchesDrawn,
      percentile: rank.limitedPercentile,
      leaderboardPlace: rank.limitedLeaderboardPlace,
      seasonOrdinal: rank.limitedSeasonOrdinal,
    };
  }

  const propTitle = formatRank(internalRank);
  const rankStyle = {
    backgroundPosition: `${
      getRankIndex(internalRank.rank, internalRank.tier) * -48
    }px 0px`,
  };

  return (
    <>
      <Alt
        defaultOpen={false}
        width={120}
        height={32}
        yOffset={0}
        direction="UP"
        tip
        doOpen={openAltRef}
        doHide={closeAltRef}
        positionRef={positionRef}
      >
        <div
          style={{
            textAlign: "center",
            lineHeight: "32px",
            width: "100%",
            height: "100%",
          }}
        >
          {propTitle}
        </div>
      </Alt>

      <div
        onMouseEnter={openAltRef.current}
        onMouseLeave={closeAltRef.current}
        ref={positionRef}
        className={`${selected ? "item-selected" : ""} item`}
        onClick={() => history.push(uri)}
      >
        <div style={rankStyle} className={rankClass} />
      </div>
    </>
  );
}

interface TopNavProps {
  openSettings: () => void;
  openArenaIdSelector: () => void;
}

export default function TopNav(props: TopNavProps): JSX.Element {
  const { openSettings, openArenaIdSelector } = props;

  const [compact, setCompact] = useState(false);
  const currentUUID = useSelector(
    (state: AppState) => state.mainData.currentUUID
  );

  const uuidData = useSelector((state: AppState) => state.mainData.uuidData);

  const topNavIconsRef: any = useRef(null);
  const windowSize = useWindowSize();

  const defaultTab = {
    compact: compact,
  };

  const homeTab = {
    compact: false,
    uri: "home",
    icon: "icon-home",
    title: "",
  };
  const myDecksTab = {
    ...defaultTab,
    uri: "decks",
    title: "MY DECKS",
  };
  const historyTab = {
    ...defaultTab,
    uri: "history",
    title: "HISTORY",
  };
  const timelineTab = {
    ...defaultTab,
    uri: "timeline",
    title: "TIMELINE",
  };
  const draftsTab = {
    ...defaultTab,
    uri: "drafts",
    title: "DRAFTS",
  };
  const exploreTab = {
    ...defaultTab,
    uri: "explore",
    title: "EXPLORE",
  };
  const collectionTab = {
    ...defaultTab,
    uri: "collection",
    title: "COLLECTION",
  };

  const contructedNav = {
    uri: "/history",
    rank: uuidData[currentUUID]?.rank || defaultRankData,
    rankClass: "top-constructed-rank",
  };

  const limitedNav = {
    uri: "/history",
    rank: uuidData[currentUUID]?.rank || defaultRankData,
    rankClass: "top-limited-rank",
  };

  useEffect(() => {
    if ((windowSize as any).width < 750) {
      if (!compact) {
        setCompact(true);
      }
    } else if (compact) {
      setCompact(false);
    }
  }, [windowSize, compact]);

  const userName = getLocalSetting("username");

  const items = (
    <>
      <TopNavItem {...myDecksTab} />
      <TopNavItem {...historyTab} />
      <TopNavItem {...timelineTab} />
      <TopNavItem {...draftsTab} />
      <TopNavItem {...exploreTab} />
      <TopNavItem {...collectionTab} />
    </>
  );

  return (
    <div className={`top-nav-container ${compact ? "compact" : ""}`}>
      <div className="top-nav">
        <div className="icons" style={{ flexGrow: 0 }}>
          <TopNavItem {...homeTab} />
        </div>
        {!compact && (
          <div ref={topNavIconsRef} className="icons">
            {items}
          </div>
        )}
        <div className="info">
          <div className="userdata-container">
            <TopRankIcon type="constructed" {...contructedNav} />
            <TopRankIcon type="limited" {...limitedNav} />
            <div className="top-username" onClick={openArenaIdSelector}>
              {userName}
            </div>
            <IconButton
              style={{ margin: `auto 8px` }}
              onClick={openSettings}
              icon={settingsIcon}
            />
          </div>
        </div>
      </div>
      {compact && (
        <div className="top-nav">
          <div ref={topNavIconsRef} className="icons-compact">
            {items}
          </div>
        </div>
      )}
    </div>
  );
}
