import { Route, Switch, useRouteMatch } from "react-router-dom";

import useDbUser from "../../../hooks/useDbUser";
import Section from "../../ui/Section";
import DraftsHome from "./DraftsHome";
import LiveDraftView from "./LiveDraftView";

export default function ViewDrafts() {
  const { url } = useRouteMatch();
  const [, loggedIn] = useDbUser();

  return (
    <Section
      style={{
        marginTop: "16px",
        flexDirection: "column",
        textAlign: "center",
      }}
    >
      {loggedIn && (
        <Switch>
          <Route exact path={`${url}/live/:id`} component={LiveDraftView} />
          <Route exact path={`${url}/`} component={DraftsHome} />
        </Switch>
      )}
    </Section>
  );
}
