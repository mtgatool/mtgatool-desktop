/* eslint-disable react/jsx-props-no-spreading */
import _ from "lodash";
import { useState, useRef, useEffect } from "react";
import { useLocation, useHistory, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getRankIndex, InternalRankData } from "mtgatool-shared";

import formatRank from "../utils/formatRank";

import useWindowSize from "../hooks/useWindowSize";

import settingsIcon from "../assets/images/cog.png";

import IconButton from "./ui/IconButton";
import getLocalSetting from "../utils/getLocalSetting";
import { AppState } from "../redux/stores/rendererStore";
import Alt from "./Alt";
import vodiFn from "../utils/voidfn";
import { CombinedRankInfo } from "../background/onLabel/InEventGetCombinedRankInfo";
import { defaultUUIDData } from "../types/dbTypes";

interface TopNavItemProps {
  compact: boolean;
  icon: string;
  uri: string;
  title: string;
}

function TopNavItem(props: TopNavItemProps): JSX.Element {
  const { compact, icon, uri, title } = props;

  const params = useParams<{ page: string }>();
  const history = useHistory();

  return compact ? (
    <div
      className={`${
        params.page === uri ? "item-selected" : ""
      } item-no-label item`}
      onClick={() => history.push(`/${uri}`)}
    >
      <div className={`icon ${icon}`} title={_.camelCase(title)} />
    </div>
  ) : (
    <div
      className={`${params.page === uri ? "item-selected" : ""} item ${
        title == "" ? ` ${"item-no-label"}` : ""
      }`}
      onClick={() => history.push(`/${uri}`)}
    >
      {title !== "" ? (
        <span className="item-text">{title}</span>
      ) : (
        <div className={`icon ${icon}`} title={_.camelCase(title)} />
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
}

export default function TopNav(props: TopNavProps): JSX.Element {
  const { openSettings } = props;

  const [compact, setCompact] = useState(false);
  const currentUUID = useSelector(
    (state: AppState) => state.mainData.currentUUID
  );

  const uuidData = useSelector((state: AppState) => state.mainData.uuidData);

  const topNavIconsRef: any = useRef(null);
  const dispatcher = useDispatch();
  const windowSize = useWindowSize();

  const defaultTab = {
    dispatcher: dispatcher,
    compact: compact,
  };

  const homeTab = { ...defaultTab, uri: "home", icon: "icon-home", title: "" };
  const myDecksTab = {
    ...defaultTab,
    uri: "decks",
    icon: "icon-my-decks",
    title: "MY DECKS",
  };
  const historyTab = {
    ...defaultTab,
    uri: "history",
    icon: "icon-history",
    title: "HISTORY",
  };
  const timelineTab = {
    ...defaultTab,
    uri: "timeline",
    icon: "icon-timeline",
    title: "TIMELINE",
  };
  const draftsTab = {
    ...defaultTab,
    uri: "drafts",
    icon: "icon-drafts",
    title: "DRAFTS",
  };
  const exploreTab = {
    ...defaultTab,
    uri: "explore",
    icon: "icon-explore",
    title: "EXPLORE",
  };
  const collectionTab = {
    ...defaultTab,
    uri: "collection",
    icon: "icon-collection",
    title: "COLLECTION",
  };

  const contructedNav = {
    uri: "history",
    rank: uuidData[currentUUID]?.rank || defaultUUIDData.rank,
    rankClass: "top-constructed-rank",
  };

  const limitedNav = {
    uri: "history",
    rank: uuidData[currentUUID]?.rank || defaultUUIDData.rank,
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

  const userName = getLocalSetting("username"); // playerData.playerName.slice(0, -6);
  const userNumerical = ""; // playerData.playerName.slice(-6);

  return (
    <div className="top-nav-container">
      <div ref={topNavIconsRef} className="icons">
        <TopNavItem {...homeTab} />
        <TopNavItem {...myDecksTab} />
        <TopNavItem {...historyTab} />
        <TopNavItem {...timelineTab} />
        <TopNavItem {...draftsTab} />
        <TopNavItem {...exploreTab} />
        <TopNavItem {...collectionTab} />
      </div>
      <div className="info">
        <div className="userdata-container">
          <TopRankIcon type="constructed" {...contructedNav} />
          <TopRankIcon type="limited" {...limitedNav} />
          <div className="top-username" title="Arena username">
            {userName}
          </div>
          <div className="top-username-id" title="Arena user ID">
            {userNumerical}
          </div>
          <IconButton
            style={{ margin: `auto 8px` }}
            onClick={openSettings}
            icon={settingsIcon}
          />
        </div>
      </div>
    </div>
  );
}
