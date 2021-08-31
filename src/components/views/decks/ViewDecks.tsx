import { Route, Switch, useRouteMatch } from "react-router-dom";

import { useSelector } from "react-redux";
import useDbUser from "../../../hooks/useDbUser";

import DecksList from "./DecksList";
import DeckView from "./DeckView";

import { AppState } from "../../../redux/stores/rendererStore";

export default function ViewDecks() {
  const { url } = useRouteMatch();
  const [, loggedIn] = useDbUser();

  const { decksIndex, decks } = useSelector(
    (state: AppState) => state.mainData
  );

  return (
    <>
      {loggedIn && decksIndex && decks ? (
        <Switch>
          <Route exact path={`${url}/:id`} component={DeckView} />
          <Route exact path={`${url}/`} component={DecksList} />
        </Switch>
      ) : (
        <></>
      )}
    </>
  );
}
