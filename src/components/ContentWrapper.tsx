import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { animated, useTransition } from "react-spring";
import ViewHome from "./views/home/ViewHome";
import ViewDecks from "./views/decks/ViewDecks";
import ViewHistory from "./views/history/ViewHistory";
import linkGunToRedux from "../redux/linkGunToRedux";
import PopupComponent from "./PopupComponent";
import PassphraseGenerate from "./PassphraseGenerate";
import voiFn from "../utils/voidfn";

const views = {
  home: ViewHome,
  decks: ViewDecks,
  history: ViewHistory,
  timeline: ViewHome,
  events: ViewHome,
  explore: ViewHome,
  cards: ViewHome,
  economy: ViewHome,
  collection: ViewHome,
};

export default function ContentWrapper() {
  const params = useParams<{ page: string }>();
  const paths = useRef<string[]>([params.page]);

  const prevIndex = Object.keys(views).findIndex(
    (k) => k == paths.current[paths.current.length - 1]
  );
  const viewIndex = Object.keys(views).findIndex((k) => params.page == k);

  const leftAnim = {
    from: { opacity: 0, transform: "translate3d(100%, 0, 0)" },
    enter: { opacity: 1, transform: "translate3d(0%, 0, 0)" },
    leave: { opacity: 0, transform: "translate3d(-100%, 0, 0)" },
  };

  const rightAnim = {
    from: { opacity: 0, transform: "translate3d(-100%, 0, 0)" },
    enter: { opacity: 1, transform: "translate3d(0%, 0, 0)" },
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

  useEffect(() => {
    linkGunToRedux();
  }, []);

  const openPopup = useRef<() => void>(voiFn);
  const closePopup = useRef<() => void>(voiFn);

  return (
    <>
      <PopupComponent
        open={false}
        width="1000px"
        height="500px"
        openFnRef={openPopup}
        closeFnRef={closePopup}
      >
        <PassphraseGenerate onClose={closePopup.current} />
      </PopupComponent>
      <div className="wrapper">
        <div className="wrapper-inner">
          <div className="overflow-ux">
            {transitions.map(({ item, props }) => {
              const Page = Object.values(views)[item];
              return (
                <animated.div
                  className="view-container"
                  key={Object.keys(views)[item]}
                  style={{
                    ...props,
                  }}
                >
                  <Page openPassphrasPopup={openPopup.current} />
                </animated.div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
