import { Deck } from "mtgatool-shared";
import { useSelector } from "react-redux";
import { Route, Switch, useRouteMatch } from "react-router-dom";

import useIsLoggedIn from "../../../hooks/useIsLoggedIn";
import { AppState } from "../../../redux/stores/rendererStore";
import DecksList from "./DecksList";
import DeckView from "./DeckView";

interface ViewDecksProps {
  openHistoryStatsPopup: () => void;
  datePickerDoShow: () => void;
  openDeckView: (deck: Deck) => void;
}

export default function ViewDecks(props: ViewDecksProps) {
  const { url } = useRouteMatch();
  const loggedIn = useIsLoggedIn();

  const { openHistoryStatsPopup, datePickerDoShow, openDeckView } = props;

  const decksIndex = useSelector(
    (state: AppState) => state.mainData.decksIndex
  );

  return (
    <>
      {loggedIn && decksIndex ? (
        <Switch>
          <Route exact path={`${url}/:id`}>
            <DeckView openDeckView={openDeckView} />
          </Route>
          <Route
            exact
            path={`${url}/`}
            component={() => (
              <DecksList
                datePickerDoShow={datePickerDoShow}
                openHistoryStatsPopup={openHistoryStatsPopup}
              />
            )}
          />
        </Switch>
      ) : (
        <></>
      )}
    </>
  );
}
