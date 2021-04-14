import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { animated, useTransition } from "react-spring";
import ViewDecks from "./views/decks/ViewDecks";
import ViewHome from "./views/home/ViewHome";

const views = {
  "/home": ViewHome,
  "/decks": ViewDecks,
  "/history": ViewHome,
  "/timeline": ViewHome,
  "/events": ViewHome,
  "/explore": ViewHome,
  "/cards": ViewHome,
  "/economy": ViewHome,
  "/collection": ViewHome,
};

export default function ContentWrapper() {
  const location = useLocation<string>();
  const paths = useRef<string[]>([location.pathname]);

  const prevIndex = Object.keys(views).findIndex(
    (k) => k == paths.current[paths.current.length - 1]
  );
  const viewIndex = Object.keys(views).findIndex((k) => k == location.pathname);

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
    paths.current.push(location.pathname);
  }, [location]);

  return (
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
                <Page />
              </animated.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
