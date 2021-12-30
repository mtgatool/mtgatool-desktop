import { Route, Switch, useRouteMatch } from "react-router-dom";

import { useSelector } from "react-redux";
import { MutableRefObject, useEffect, useState } from "react";
import useDbUser from "../../../hooks/useDbUser";

import HistoryList from "./HistoryList";
import MatchView from "./MatchView";

import { AppState } from "../../../redux/stores/rendererStore";
import getMatchesData, { MatchData } from "./getMatchesData";

interface ViewHistoryProps {
  openHistoryStatsPopup: () => void;
  datePickerDate: Date;
  datePickerDoShow: () => void;
  setDatePickerDate: (newDate: Date) => void;
  datePickerCallbackRef: MutableRefObject<(d: Date) => void>;
}

export default function ViewHistory(props: ViewHistoryProps) {
  const {
    openHistoryStatsPopup,
    datePickerDate,
    datePickerDoShow,
    setDatePickerDate,
    datePickerCallbackRef,
  } = props;
  const { url } = useRouteMatch();
  const [, loggedIn] = useDbUser();

  const currentUUID = useSelector(
    (state: AppState) => state.mainData.currentUUID
  );

  const matchesIndex = useSelector(
    (state: AppState) => state.mainData.matchesIndex
  );
  const [matchesData, setMatchesData] = useState<MatchData[]>([]);

  useEffect(() => {
    getMatchesData(matchesIndex).then((data) =>
      setMatchesData(data.filter((m) => m.uuid === currentUUID))
    );
  }, [matchesIndex, currentUUID]);

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
                datePickerDate={datePickerDate}
                datePickerDoShow={datePickerDoShow}
                setDatePickerDate={setDatePickerDate}
                datePickerCallbackRef={datePickerCallbackRef}
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
