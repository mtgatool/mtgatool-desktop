import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Route, Switch, useRouteMatch } from "react-router-dom";

import useDbUser from "../../../hooks/useDbUser";
import { AppState } from "../../../redux/stores/rendererStore";
import getMatchesData, { MatchData } from "./getMatchesData";
import HistoryList from "./HistoryList";
import MatchView from "./MatchView";

interface ViewHistoryProps {
  openHistoryStatsPopup: () => void;
  datePickerDoShow: () => void;
}

export default function ViewHistory(props: ViewHistoryProps) {
  const { openHistoryStatsPopup, datePickerDoShow } = props;
  const { url } = useRouteMatch();
  const [, loggedIn] = useDbUser();

  const currentUUID = useSelector(
    (state: AppState) => state.mainData.currentUUID
  );

  const matchesIndex = useSelector(
    (state: AppState) => state.mainData.matchesIndex
  );
  const [matchesData, setMatchesData] = useState<MatchData[]>([]);

  useEffect(() => {
    getMatchesData(matchesIndex).then((data) =>
      setMatchesData(data.filter((m) => m.uuid === currentUUID))
    );
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
