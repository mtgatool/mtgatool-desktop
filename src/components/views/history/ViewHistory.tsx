import { Fragment } from "react";
import useGunSelectorObject from "../../../hooks/useGunSelectorObject";
import useGunUser from "../../../hooks/useGunUser";
import { GunUser } from "../../../types/gunTypes";
import ListItemMatch from "./ListItemMatch";

export default function ViewHistory() {
  const [userRef, loggedIn] = useGunUser();

  const matchesRef = userRef.get("matches");
  const matches = useGunSelectorObject<GunUser["matches"]>(matchesRef, true);

  return (
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
  );
}
