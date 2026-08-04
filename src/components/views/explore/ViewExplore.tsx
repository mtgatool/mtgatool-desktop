import { Route, Switch, useRouteMatch } from "react-router-dom";

import useIsLoggedIn from "../../../hooks/useIsLoggedIn";
import ViewExploreDeck from "./ViewExploreDeck";
import ViewExploreEvent from "./ViewExploreEvent";
import ViewExploreHome from "./ViewExploreHome";

export default function ViewExplore() {
  const { url } = useRouteMatch();
  const loggedIn = useIsLoggedIn();

  return (
    <>
      {loggedIn ? (
        <Switch>
          <Route exact path={`${url}/`} component={ViewExploreHome} />
          <Route exact path={`${url}/:id`} component={ViewExploreEvent} />
          <Route exact path={`${url}/:id/:hash`} component={ViewExploreDeck} />
        </Switch>
      ) : (
        <></>
      )}
    </>
  );
}
