import { Route, Switch, useRouteMatch } from "react-router-dom";

import useIsLoggedIn from "../../../hooks/useIsLoggedIn";
import LiveMatch from "./LiveMatch";

export default function ViewLiveMatch() {
  const { url } = useRouteMatch();
  const loggedIn = useIsLoggedIn();

  return (
    <>
      {loggedIn && (
        <Switch>
          <Route exact path={`${url}/:id`} component={LiveMatch} />
        </Switch>
      )}
    </>
  );
}
