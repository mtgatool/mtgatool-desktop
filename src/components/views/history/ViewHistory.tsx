import { useSelector } from "react-redux";
import { Route, Switch, useRouteMatch } from "react-router-dom";

import useIsLoggedIn from "../../../hooks/useIsLoggedIn";
import { AppState } from "../../../redux/stores/rendererStore";
import { MatchData } from "./convertDbMatchData";
import HistoryList from "./HistoryList";
import MatchView from "./MatchView";

interface ViewHistoryProps {
  openHistoryStatsPopup: () => void;
  datePickerDoShow: () => void;
  matchesData: MatchData[];
}

export default function ViewHistory(props: ViewHistoryProps) {
  const { openHistoryStatsPopup, datePickerDoShow, matchesData } = props;
  const { url } = useRouteMatch();
  const loggedIn = useIsLoggedIn();

  const matchesIndex = useSelector(
    (state: AppState) => state.mainData.matchesIndex
  );

  return (
    <>
      {loggedIn && matchesIndex ? (
        <Switch>
          <Route exact path={`${url}/:id`} component={MatchView} />
          <Route
            exact
            path={`${url}/`}
            component={() => (
              <HistoryList
                datePickerDoShow={datePickerDoShow}
                openHistoryStatsPopup={openHistoryStatsPopup}
                matchesData={matchesData}
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
