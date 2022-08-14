import { Switch, Route, useRouteMatch } from "react-router-dom";
import useDbUser from "../../../hooks/useDbUser";

import LiveMatch from "./LiveMatch";

export default function ViewLiveMatch() {
  const { url } = useRouteMatch();
  const [, loggedIn] = useDbUser();

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
