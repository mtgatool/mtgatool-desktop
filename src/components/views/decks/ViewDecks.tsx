import { useSelector } from "react-redux";
import { Route, Switch, useRouteMatch } from "react-router-dom";

import DecksList from "./DecksList";
import DeckView from "./DeckView";

import useGunUser from "../../../hooks/useGunUser";

import { AppState } from "../../../redux/stores/rendererStore";

export default function ViewDecks() {
  const { url } = useRouteMatch();
  const [, loggedIn] = useGunUser();

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
