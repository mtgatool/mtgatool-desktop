import { Route, Switch, useRouteMatch } from "react-router-dom";

import { useSelector } from "react-redux";
import useDbUser from "../../../hooks/useDbUser";

import HistoryList from "./HistoryList";
import MatchView from "./MatchView";

import { AppState } from "../../../redux/stores/rendererStore";

export default function ViewHistory() {
  const { url } = useRouteMatch();
  const [, loggedIn] = useDbUser();

  const { matchesIndex } = useSelector((state: AppState) => state.mainData);

  return (
    <>
      {loggedIn && matchesIndex ? (
        <Switch>
          <Route exact path={`${url}/:id`} component={MatchView} />
          <Route exact path={`${url}/`} component={HistoryList} />
        </Switch>
      ) : (
        <></>
      )}
    </>
  );
}
