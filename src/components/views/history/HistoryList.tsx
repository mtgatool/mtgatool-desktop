import { Fragment, useCallback } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { AppState } from "../../../redux/stores/rendererStore";
import { GunMatch } from "../../../types/gunTypes";
import ListItemMatch from "./ListItemMatch";

export default function HistoryList() {
  const history = useHistory();
  const matches = useSelector((state: AppState) => state.mainData.matches);

  const openMatch = useCallback(
    (match: GunMatch) => {
      history.push(`/history/${match.matchId}`);
    },
    [history]
  );

  return (
    <>
      <div className="section" style={{ marginBottom: "0px" }} />
      <div className="section">
        <div className="history-table-wrapper">
          {matches &&
            Object.keys(matches)
              .sort((a, b) => {
                if (matches[a].timestamp > matches[b].timestamp) return -1;
                if (matches[a].timestamp < matches[b].timestamp) return 1;
                return 0;
              })
              .map((matchId) => {
                if (matches[matchId] && matches[matchId].internalMatch) {
                  return (
                    <ListItemMatch
                      key={matchId}
                      match={matches[matchId]}
                      openMatchCallback={openMatch}
                    />
                  );
                }
                return <Fragment key={matchId} />;
              })}
        </div>
      </div>
    </>
  );
}
