import { Route, Switch, useRouteMatch } from "react-router-dom";

import { useSelector } from "react-redux";
import useDbUser from "../../../hooks/useDbUser";

import { AppState } from "../../../redux/stores/rendererStore";
import ViewExploreHome from "./ViewExploreHome";
import ViewExploreEvent from "./ViewExploreEvent";

export default function ViewExplore() {
  const { url } = useRouteMatch();
  const [, loggedIn] = useDbUser();

  const decksIndex = useSelector(
    (state: AppState) => state.mainData.decksIndex
  );

  return (
    <>
      {loggedIn && decksIndex ? (
        <Switch>
          <Route exact path={`${url}/`} component={ViewExploreHome} />
          <Route exact path={`${url}/:id`} component={ViewExploreEvent} />
        </Switch>
      ) : (
        <></>
      )}
    </>
  );
}
