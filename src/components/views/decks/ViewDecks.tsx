import { Route, Switch, useRouteMatch } from "react-router-dom";

import { useSelector } from "react-redux";
import useDbUser from "../../../hooks/useDbUser";

import DecksList from "./DecksList";
import DeckView from "./DeckView";

import { AppState } from "../../../redux/stores/rendererStore";

interface ViewDecksProps {
  openHistoryStatsPopup: () => void;
  datePickerDoShow: () => void;
}

export default function ViewDecks(props: ViewDecksProps) {
  const { url } = useRouteMatch();
  const [, loggedIn] = useDbUser();

  const { openHistoryStatsPopup, datePickerDoShow } = props;

  const decksIndex = useSelector(
    (state: AppState) => state.mainData.decksIndex
  );

  return (
    <>
      {loggedIn && decksIndex ? (
        <Switch>
          <Route exact path={`${url}/:id`} component={DeckView} />
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
