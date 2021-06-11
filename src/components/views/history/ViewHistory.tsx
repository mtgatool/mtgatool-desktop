import { Route, Switch, useRouteMatch } from "react-router-dom";

import { useSelector } from "react-redux";
import useGunUser from "../../../hooks/useGunUser";

import HistoryList from "./HistoryList";
import MatchView from "./MatchView";

import { AppState } from "../../../redux/stores/rendererStore";

export default function ViewHistory() {
  const { url } = useRouteMatch();
  const [, loggedIn] = useGunUser();

  const matches = useSelector((state: AppState) => state.mainData.matches);

  return (
    <>
      {loggedIn && matches ? (
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
