import { Route, Switch, useRouteMatch } from "react-router-dom";

import UserView from "./UserView";

export default function ViewUser() {
  const { url } = useRouteMatch();

  return (
    <Switch>
      <Route exact path={`${url}/:key`} component={UserView} />
    </Switch>
  );
}
