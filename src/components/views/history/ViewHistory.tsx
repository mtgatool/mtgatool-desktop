import { Route, Switch, useRouteMatch } from "react-router-dom";

import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import useDbUser from "../../../hooks/useDbUser";

import HistoryList from "./HistoryList";
import MatchView from "./MatchView";

import { AppState } from "../../../redux/stores/rendererStore";
import getMatchesData, { MatchData } from "./getMatchesData";

interface ViewHistoryProps {
  openHistoryStatsPopup: () => void;
}

export default function ViewHistory(props: ViewHistoryProps) {
  const { openHistoryStatsPopup } = props;
  const { url } = useRouteMatch();
  const [, loggedIn] = useDbUser();

  const matchesIndex = useSelector(
    (state: AppState) => state.mainData.matchesIndex
  );
  const [matchesData, setMatchesData] = useState<MatchData[]>([]);

  useEffect(() => {
    getMatchesData(matchesIndex).then(setMatchesData);
  }, [matchesIndex]);

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
