import { database, Deck } from "mtgatool-shared";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { animated, useTransition } from "react-spring";

import useDatePicker from "../hooks/useDatePicker";
import reduxAction from "../redux/reduxAction";
import {
  DateOption,
  setDate,
  setDateOption,
} from "../redux/slices/FilterSlice";
import { AppState } from "../redux/stores/rendererStore";
import { getMatchesData } from "../toolDb/worker-wrapper";
import { CardsData } from "../types/collectionTypes";
import { defaultCardsData } from "../types/dbTypes";
import aggregateStats from "../utils/aggregateStats";
import isElectron from "../utils/electron/isElectron";
import getCssQuality from "../utils/getCssQuality";
import getPopupClass from "../utils/getPopupClass";
import doHistoryFilter from "../utils/tables/doHistoryFilter";
import vodiFn from "../utils/voidfn";
import PopupComponent from "./PopupComponent";
import DeckViewPopup from "./popups/DeckViewPopup";
import PostSignupPopup from "./PostSignupPopup";
import AdvancedSearch from "./views/collection/advancedSearch";
import ViewCollection from "./views/collection/ViewCollection";
import ViewDecks from "./views/decks/ViewDecks";
import ViewDrafts from "./views/drafts/ViewDrafts";
import ViewExplore from "./views/explore/ViewExplore";
import ViewExploreAggregator from "./views/explore/ViewExploreAggregator";
import { MatchData } from "./views/history/convertDbMatchData";
import HistoryStats from "./views/history/HistoryStats";
import ViewHistory from "./views/history/ViewHistory";
import ViewHome from "./views/home/ViewHome";
import ViewLiveMatch from "./views/livematch/ViewLiveMatch";
import ViewUser from "./views/user/ViewUser";
import ViewWip from "./views/wip/ViewWip";

const views = {
  home: ViewHome,
  decks: ViewDecks,
  history: ViewHistory,
  timeline: ViewWip,
  drafts: ViewDrafts,
  match: ViewLiveMatch,
  explore: ViewExplore,
  collection: ViewCollection,
  aggregator: ViewExploreAggregator,
  user: ViewUser,
};

function delay(transition: any, timeout: number): any {
  return (_item: any) => async (next: any, _cancel: any) => {
    await new Promise((resolve) => setTimeout(resolve, timeout));
    await next(transition);
  };
}

export interface ContentWrapperProps {
  forceOs?: string;
}

const ContentWrapper = (mainProps: ContentWrapperProps) => {
  const { forceOs } = mainProps;

  const matchFilters = useSelector(
    (state: AppState) => state.filter.matchDataFilters
  );

  const dispatch = useDispatch();
  const params = useParams<{ page: string }>();
  const paths = useRef<string[]>([params.page]);
  const [collectionData, setCollectionData] = useState<CardsData[]>([]);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker("cards-worker/index.js", { type: "module" });
  }, []);

  const os = forceOs || (isElectron() ? process.platform : "");

  const currentUUID = useSelector(
    (state: AppState) => state.mainData.currentUUID
  );

  const uuidData = useSelector((state: AppState) => state.mainData.uuidData);

  const showPostSignup = useSelector(
    (state: AppState) => state.renderer.showPostSignup
  );
  const forceCollection = useSelector(
    (state: AppState) => state.mainData.forceCollection
  );
  const matchesIndex = useSelector(
    (state: AppState) => state.mainData.matchesIndex
  );

  const [matchesData, setMatchesData] = useState<MatchData[]>([]);

  useEffect(() => {
    getMatchesData(matchesIndex, currentUUID).then((d) => {
      if (d) {
        setMatchesData(d);
      }
    });

    // hacky hack to listen for the after login matches data message
    const listener = (e: any) => {
      const { type, value } = e.data;
      if (type === `MATCHES_DATA_OK`) {
        setMatchesData(value);
      }
    };

    if (window.toolDbWorker) {
      window.toolDbWorker.addEventListener("message", listener);
    }

    return () => {
      if (window.toolDbWorker) {
        window.toolDbWorker.removeEventListener("message", listener);
      }
    };
  }, [matchesIndex, currentUUID]);

  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        cards: uuidData[currentUUID]?.cards || defaultCardsData,
        cardsList: database.cardList,
        allCards: database.cards,
        setNames: database.setNames,
        sets: database.sets,
      });
      workerRef.current.onmessage = (e) => {
        setCollectionData(e.data);
      };
    }
  }, [uuidData, currentUUID, forceCollection]);

  useEffect(() => {
    if (params.page === "decks") {
      reduxAction(dispatch, {
        type: "SET_FULL_STATS",
        arg: aggregateStats(matchesData, matchFilters),
      });

      if (matchFilters) {
        const filtered = doHistoryFilter(matchesData, matchFilters, undefined);

        const newHistoryStats = aggregateStats(filtered);
        reduxAction(dispatch, {
          type: "SET_HISTORY_STATS",
          arg: newHistoryStats,
        });
      }
    }
  }, [dispatch, params, matchesData, matchFilters]);

  const prevIndex = Object.keys(views).findIndex(
    (k) => k == paths.current[paths.current.length - 1]
  );
  let viewIndex = Object.keys(views).findIndex((k) => params.page == k);
  if (viewIndex === -1) viewIndex = 0;

  const leftAnim = {
    from: { opacity: 0, transform: "translate3d(100%, 0, 0)" },
    enter: delay({ opacity: 1, transform: "translate3d(0%, 0, 0)" }, 100),
    leave: { opacity: 0, transform: "translate3d(-100%, 0, 0)" },
  };

  const rightAnim = {
    from: { opacity: 0, transform: "translate3d(-100%, 0, 0)" },
    enter: delay({ opacity: 1, transform: "translate3d(0%, 0, 0)" }, 100),
    leave: { opacity: 0, transform: "translate3d(100%, 0, 0)" },
  };

  const transitions = useTransition(
    viewIndex,
    (p) => p,
    viewIndex > prevIndex ? leftAnim : rightAnim
  );

  useEffect(() => {
    paths.current.push(params.page);
  }, [params]);

  const openPostSignup = useRef<() => void>(vodiFn);
  const closePostSignup = useRef<() => void>(vodiFn);

  const openAdvancedCollectionSearch = useRef<() => void>(vodiFn);
  const closeAdvancedCollectionSearch = useRef<() => void>(vodiFn);

  const openHistoryStatsPopup = useRef<() => void>(vodiFn);
  const closeHistoryStatsPopup = useRef<() => void>(vodiFn);

  const openDeckView = useRef<() => void>(vodiFn);
  const closenDeckView = useRef<() => void>(vodiFn);
  const [deckView, setDeckView] = useState<Deck>(new Deck());

  useEffect(() => {
    if (showPostSignup) {
      openPostSignup.current();
    }
  }, [showPostSignup]);

  const CurrentPage = Object.values(views)[viewIndex];

  const datePickerCallbackRef = useRef((_d: Date) => {
    dispatch(setDate(_d));
    dispatch(setDateOption("Custom" as DateOption));
  });

  // noinspection JSUnusedLocalSymbols
  const [_, datePickerDoShow, datePickerElement] = useDatePicker(
    new Date(0),
    undefined,
    datePickerCallbackRef.current || vodiFn
  );

  return (
    <>
      {datePickerElement}
      <PopupComponent
        open={false}
        className={getPopupClass(os)}
        width="900px"
        height="440px"
        openFnRef={openPostSignup}
        closeFnRef={closePostSignup}
      >
        <PostSignupPopup />
      </PopupComponent>

      <PopupComponent
        open={false}
        className={getPopupClass(os)}
        width="1000px"
        height="620px"
        openFnRef={openAdvancedCollectionSearch}
        closeFnRef={closeAdvancedCollectionSearch}
      >
        <AdvancedSearch closeCallback={closeAdvancedCollectionSearch.current} />
      </PopupComponent>

      <PopupComponent
        open={false}
        className={getPopupClass(os)}
        width="1000px"
        height="600px"
        openFnRef={openHistoryStatsPopup}
        closeFnRef={closeHistoryStatsPopup}
      >
        <HistoryStats />
      </PopupComponent>

      <PopupComponent
        open={false}
        className={getPopupClass(os)}
        width="640px"
        height="100%"
        openFnRef={openDeckView}
        closeFnRef={closenDeckView}
        persistent={false}
      >
        <DeckViewPopup deck={deckView} onClose={closenDeckView.current} />
      </PopupComponent>

      <div className="wrapper">
        <div className="wrapper-inner">
          <div className="overflow-ux">
            {getCssQuality() === "high" ? (
              transitions.map(({ item, props }) => {
                const Page = Object.values(views)[item];
                return (
                  <animated.div
                    className="view-container"
                    key={`${Object.keys(views)[item]}-container`}
                    style={{
                      ...props,
                    }}
                  >
                    <Page
                      key={`${Object.keys(views)[item]}-page`}
                      collectionData={collectionData}
                      openAdvancedCollectionSearch={
                        openAdvancedCollectionSearch.current
                      }
                      openHistoryStatsPopup={openHistoryStatsPopup.current}
                      openDeckView={(deck: Deck) => {
                        setDeckView(deck);
                        openDeckView.current();
                      }}
                      datePickerDoShow={datePickerDoShow}
                      matchesData={matchesData}
                    />
                  </animated.div>
                );
              })
            ) : (
              <div
                className="view-container"
                key={`${Object.keys(views)[viewIndex]}-container`}
              >
                <CurrentPage
                  key={`${Object.keys(views)[viewIndex]}-page`}
                  collectionData={collectionData}
                  openAdvancedCollectionSearch={
                    openAdvancedCollectionSearch.current
                  }
                  openDeckView={(deck: Deck) => {
                    setDeckView(deck);
                    openDeckView.current();
                  }}
                  openHistoryStatsPopup={openHistoryStatsPopup.current}
                  datePickerDoShow={datePickerDoShow}
                  matchesData={matchesData}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

ContentWrapper.whyDidYouRender = true;

export default ContentWrapper;
