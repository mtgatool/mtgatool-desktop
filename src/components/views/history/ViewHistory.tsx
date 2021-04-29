import { Fragment } from "react";
import { useSelector } from "react-redux";
import useGunUser from "../../../hooks/useGunUser";
import { AppState } from "../../../redux/stores/rendererStore";
import ListItemMatch from "./ListItemMatch";

export default function ViewHistory() {
  const [, loggedIn] = useGunUser();
  const matches = useSelector((state: AppState) => state.mainData.matches);

  return (
    <>
      <div className="section" style={{ marginBottom: "0px" }} />
      <div className="section">
        <div className="history-table-wrapper">
          {loggedIn &&
            matches &&
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
                      openMatchCallback={() => {
                        //
                      }}
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
