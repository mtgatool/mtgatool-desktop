import { useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { animated, useTransition } from "react-spring";

import { useDispatch, useSelector } from "react-redux";
import PopupComponent from "./PopupComponent";
import vodiFn from "../utils/voidfn";

import ViewWip from "./views/wip/ViewWip";
import ViewHome from "./views/home/ViewHome";
import ViewDecks from "./views/decks/ViewDecks";
import ViewHistory from "./views/history/ViewHistory";
import ViewCollection from "./views/collection/ViewCollection";
import AdvancedSearch from "./views/collection/advancedSearch";
import { AppState } from "../redux/stores/rendererStore";
import getCollectionData from "./views/collection/cards/getCollectionData";

import { DbMatch } from "../types/dbTypes";
import reduxAction from "../redux/reduxAction";
import aggregateStats from "../utils/aggregateStats";
import getCssQuality from "../utils/getCssQuality";
import HistoryStats from "./views/history/HistoryStats";
import { convertDbMatchToData } from "./views/history/getMatchesData";
import getLocalDbValue from "../toolDb/getLocalDbValue";

const views = {
  home: ViewHome,
  decks: ViewDecks,
  history: ViewHistory,
  timeline: ViewWip,
  drafts: ViewWip,
  explore: ViewWip,
  collection: ViewCollection,
};

function delay(transition: any, timeout: number): any {
  return (_item: any) => async (next: any, _cancel: any) => {
    await new Promise((resolve) => setTimeout(resolve, timeout));
    await next(transition);
  };
}

const ContentWrapper = () => {
  const dispatch = useDispatch();
  const params = useParams<{ page: string }>();
  const paths = useRef<string[]>([params.page]);

  const cards = useSelector((state: AppState) => state.mainData.cards);
  const cardsNew = useSelector((state: AppState) => state.mainData.cardsNew);
  const forceCollection = useSelector(
    (state: AppState) => state.mainData.forceCollection
  );
  const matchesIndex = useSelector(
    (state: AppState) => state.mainData.matchesIndex
  );

  const collectionData = useMemo(() => {
    return getCollectionData(cards, cardsNew);
  }, [cards, cardsNew, forceCollection]);

  useEffect(() => {
    if (params.page === "decks") {
      const promises = matchesIndex.map((id) => {
        return getLocalDbValue<DbMatch>(
          window.toolDb.getUserNamespacedKey(`matches-${id}`)
        );
      });

      Promise.all(promises).then((matches: any) => {
        reduxAction(dispatch, {
          type: "SET_FULL_STATS",
          arg: aggregateStats(
            matches.filter((m: any) => m).map(convertDbMatchToData)
          ),
        });
      });
    }
  }, [dispatch, params, matchesIndex]);

  const prevIndex = Object.keys(views).findIndex(
    (k) => k == paths.current[paths.current.length - 1]
  );
  const viewIndex = Object.keys(views).findIndex((k) => params.page == k);

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

  const openAdvancedCollectionSearch = useRef<() => void>(vodiFn);
  const closeAdvancedCollectionSearch = useRef<() => void>(vodiFn);

  const openHistoryStatsPopup = useRef<() => void>(vodiFn);
  const closeHistoryStatsPopup = useRef<() => void>(vodiFn);

  const CurrentPage = Object.values(views)[viewIndex];

  return (
    <>
      <PopupComponent
        open={false}
        width="1000px"
        height="500px"
        openFnRef={openAdvancedCollectionSearch}
        closeFnRef={closeAdvancedCollectionSearch}
      >
        <AdvancedSearch closeCallback={closeAdvancedCollectionSearch.current} />
      </PopupComponent>

      <PopupComponent
        open={false}
        width="1000px"
        height="600px"
        openFnRef={openHistoryStatsPopup}
        closeFnRef={closeHistoryStatsPopup}
      >
        <HistoryStats />
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
                  openHistoryStatsPopup={openHistoryStatsPopup.current}
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
