import { Route, Switch, useRouteMatch } from "react-router-dom";

import Section from "../../ui/Section";
import UserView from "./UserView";

export default function ViewUser() {
  const { url } = useRouteMatch();

  return (
    <Section style={{ marginTop: "16px" }}>
      <Switch>
        <Route exact path={`${url}/:key`} component={UserView} />
      </Switch>
    </Section>
  );
}
