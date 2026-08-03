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
  deleteMatchCallback?: (match: MatchData) => void;
}

export default function ViewHistory(props: ViewHistoryProps) {
  const {
    openHistoryStatsPopup,
    datePickerDoShow,
    matchesData,
    deleteMatchCallback,
  } = props;
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
          {/*
            `render`, not `component`: an inline arrow passed to `component` is
            a brand new component type on every render, so React remounts the
            list and its local state (the current page) resets — which it did
            every time matchesData changed, e.g. right after deleting a match.
          */}
          <Route
            exact
            path={`${url}/`}
            render={() => (
              <HistoryList
                datePickerDoShow={datePickerDoShow}
                openHistoryStatsPopup={openHistoryStatsPopup}
                matchesData={matchesData}
                deleteMatchCallback={deleteMatchCallback}
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
