/* eslint-disable react/jsx-props-no-spreading */
import _ from "lodash";
import { useState, useRef, useEffect } from "react";
import { useLocation, useHistory, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getRankIndex, InternalRank } from "mtgatool-shared";

import formatRank from "../utils/formatRank";

import useWindowSize from "../hooks/useWindowSize";

import settingsIcon from "../assets/images/cog.png";

import IconButton from "./ui/IconButton";
import getLocalSetting from "../utils/getLocalSetting";
import { AppState } from "../redux/stores/rendererStore";
import Alt from "./Alt";
import vodiFn from "../utils/voidfn";

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
  rank: InternalRank["constructed"] | InternalRank["limited"] | null;
  rankClass: string;
}

function TopRankIcon(props: TopRankProps): JSX.Element {
  const closeAltRef = useRef<() => void>(vodiFn);
  const openAltRef = useRef<() => void>(vodiFn);
  const positionRef = useRef<HTMLDivElement>(null);

  const { uri, rank, rankClass } = props;

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

  const propTitle = formatRank(rank);
  const rankStyle = {
    backgroundPosition: `${getRankIndex(rank.rank, rank.tier) * -48}px 0px`,
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
  const { currentUUID, uuidData } = useSelector(
    (state: AppState) => state.mainData
  );

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
  const eventsTab = {
    ...defaultTab,
    uri: "events",
    icon: "icon-events",
    title: "EVENTS",
  };
  const exploreTab = {
    ...defaultTab,
    uri: "explore",
    icon: "icon-explore",
    title: "EXPLORE",
  };
  const cardsTab = {
    ...defaultTab,
    uri: "cards",
    icon: "icon-collection",
    title: "CARDS",
  };
  const economyTab = {
    ...defaultTab,
    uri: "economy",
    icon: "icon-economy",
    title: "ECONOMY",
  };
  const collectionTab = {
    ...defaultTab,
    uri: "collection",
    icon: "icon-collection",
    title: "COLLECTION",
  };

  const contructedNav = {
    uri: "history",
    rank: uuidData[currentUUID]?.rank?.constructed ?? null,
    rankClass: "top-constructed-rank",
  };

  const limitedNav = {
    uri: "history",
    rank: uuidData[currentUUID]?.rank?.limited ?? null,
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
        <TopNavItem {...eventsTab} />
        <TopNavItem {...exploreTab} />
        <TopNavItem {...cardsTab} />
        <TopNavItem {...economyTab} />
        <TopNavItem {...collectionTab} />
      </div>
      <div className="info">
        <div className="userdata-container">
          <TopRankIcon {...contructedNav} />
          <TopRankIcon {...limitedNav} />
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
