import { useSelector } from "react-redux";
import { Route, Switch, useRouteMatch } from "react-router-dom";

import useIsLoggedIn from "../../../hooks/useIsLoggedIn";
import { AppState } from "../../../redux/stores/rendererStore";
import ViewExploreEvent from "./ViewExploreEvent";
import ViewExploreHome from "./ViewExploreHome";

export default function ViewExplore() {
  const { url } = useRouteMatch();
  const loggedIn = useIsLoggedIn();

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
