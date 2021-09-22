import { Route, Switch, useRouteMatch } from "react-router-dom";

import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import useDbUser from "../../../hooks/useDbUser";

import HistoryList from "./HistoryList";
import MatchView from "./MatchView";

import { AppState } from "../../../redux/stores/rendererStore";
import getMatchesData, { MatchData } from "./getMatchesData";

export default function ViewHistory() {
  const { url } = useRouteMatch();
  const [, loggedIn] = useDbUser();

  const { matchesIndex } = useSelector((state: AppState) => state.mainData);
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
            component={() => <HistoryList matchesData={matchesData} />}
          />
        </Switch>
      ) : (
        <></>
      )}
    </>
  );
}
