import { Reducer, useEffect, useReducer } from "react";
import { useSelector } from "react-redux";
import { animated, useTransition } from "react-spring";
import { textRandom } from "tool-db";
import { AppState } from "../redux/stores/rendererStore";

import { ReactComponent as CloseIcon } from "../assets/images/svg/win-close.svg";

interface PopupData {
  text: string;
  duration: number;
  color?: string;
  id: string;
}

const initialState = { queue: [] as PopupData[] };

function reducer(state: typeof initialState, action: any) {
  switch (action.type) {
    case "ADD_POPUP":
      return { queue: [...state.queue, action.popup] };
    case "CLOSE_POPUP": {
      const index = state.queue.findIndex((p) => p.id === action.id);
      const newQueue = [...state.queue];

      if (index !== -1) {
        newQueue.splice(index, 1);
      }
      return { queue: newQueue };
    }
    default:
      throw new Error();
  }
}

export default function Popups() {
  const popup = useSelector((state: AppState) => state.renderer.popup);

  const [popupsState, dispatch] = useReducer<Reducer<typeof initialState, any>>(
    reducer,
    initialState
  );

  useEffect(() => {
    if (popup) {
      const popupId = textRandom(10);
      dispatch({ type: "ADD_POPUP", popup: { ...popup, id: popupId } });
      setTimeout(() => {
        dispatch({ type: "CLOSE_POPUP", id: popupId });
      }, popup.duration);
    }
  }, [dispatch, popup]);

  const transitions = useTransition(popupsState.queue, (p) => p.id, {
    keys: (item: PopupData) => item.id,
    from: { marginTop: "0px", opacity: 0, height: "0px" },
    enter: { marginTop: "8px", opacity: 1, height: "80px" },
    leave: { marginTop: "0px", opacity: 0, height: "0px" },
    config: {
      mass: 3,
      tension: 200,
      friction: 40,
      precision: 0.01,
      velocity: 0.1,
    },
  } as any);

  return (
    <div className="info-popups">
      {transitions.map(({ item, props }: any) => {
        return (
          <animated.div
            className="popup"
            style={{
              ...props,
              borderLeft: `4px solid ${item.color || "var(--color-g)"}`,
            }}
            key={item.id}
          >
            <div className="popup-text">{item.text}</div>
            <div
              className="popup-close"
              onClick={() => dispatch({ type: "CLOSE_POPUP", id: item.id })}
            >
              <CloseIcon />
            </div>
          </animated.div>
        );
      })}
      {/* {popupsState.queue.map((pop) => {
        return (
          <div className="popup" key={pop.id}>
            {pop.text}
          </div>
        );
      })} */}
    </div>
  );
}
