import { Switch, Route, useRouteMatch } from "react-router-dom";
import useDbUser from "../../../hooks/useDbUser";
import getCssQuality from "../../../utils/getCssQuality";

import DraftsHome from "./DraftsHome";
import LiveDraftView from "./LiveDraftView";

export default function ViewDrafts() {
  const { url } = useRouteMatch();
  const [, loggedIn] = useDbUser();

  return (
    <div
      className={`section ${getCssQuality()}`}
      style={{ flexDirection: "column", textAlign: "center" }}
    >
      {loggedIn && (
        <Switch>
          <Route exact path={`${url}/live/:id`} component={LiveDraftView} />
          <Route exact path={`${url}/`} component={DraftsHome} />
        </Switch>
      )}
    </div>
  );
}
