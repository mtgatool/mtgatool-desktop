import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Route, Switch, useRouteMatch } from "react-router-dom";

import useIsLoggedIn from "../../../hooks/useIsLoggedIn";
import { AppState } from "../../../redux/stores/rendererStore";
import { MatchData } from "./convertDbMatchData";
import HistoryList from "./HistoryList";
import MatchView from "./MatchView";

interface ViewHistoryProps {
  openHistoryStatsPopup: () => void;
  datePickerDoShow: () => void;
}

export default function ViewHistory(props: ViewHistoryProps) {
  const { openHistoryStatsPopup, datePickerDoShow } = props;
  const { url } = useRouteMatch();
  const loggedIn = useIsLoggedIn();

  const currentUUID = useSelector(
    (state: AppState) => state.mainData.currentUUID
  );

  const matchesIndex = useSelector(
    (state: AppState) => state.mainData.matchesIndex
  );
  const [matchesData, setMatchesData] = useState<MatchData[]>([]);

  useEffect(() => {
    const listener = (e: any) => {
      const { type, value } = e.data;
      if (type === `MATCHES_DATA`) {
        setMatchesData(value);
      }
    };

    if (window.toolDbWorker) {
      window.toolDbWorker.postMessage({
        type: "GET_MATCHES_DATA",
        matchesIndex,
        uuid: currentUUID,
      });
      window.toolDbWorker.addEventListener("message", listener);
    }

    return () => {
      if (window.toolDbWorker) {
        window.toolDbWorker.removeEventListener("message", listener);
      }
    };
  }, [matchesIndex, currentUUID]);

  return (
    <>
      {loggedIn && matchesIndex ? (
        <Switch>
          <Route exact path={`${url}/:id`} component={MatchView} />
          <Route
            exact
            path={`${url}/`}
            component={() => (
              <HistoryList
                datePickerDoShow={datePickerDoShow}
                openHistoryStatsPopup={openHistoryStatsPopup}
                matchesData={matchesData}
              />
            )}
          />
        </Switch>
      ) : (
        <></>
      )}
    </>
  );
}
