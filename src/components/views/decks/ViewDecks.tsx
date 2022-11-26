import { useSelector } from "react-redux";
import { Route, Switch, useRouteMatch } from "react-router-dom";

import useDbUser from "../../../hooks/useDbUser";
import { AppState } from "../../../redux/stores/rendererStore";
import DecksList from "./DecksList";
import DeckView from "./DeckView";

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
