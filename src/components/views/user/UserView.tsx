import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { DEFAULT_AVATAR } from "../../../constants";
import useDebounce from "../../../hooks/useDebounce";
import useFetchAvatar from "../../../hooks/useFetchAvatar";
import useFetchUsername from "../../../hooks/useFetchUsername";
import { AppState } from "../../../redux/stores/rendererStore";
import getLocalDbValue from "../../../toolDb/getLocalDbValue";
import { DbMatch } from "../../../types/dbTypes";
import { convertDbMatchToData, MatchData } from "../history/getMatchesData";
import UserHistoryList from "./UserHistoryList";

export default function UserView() {
  const { key } = useParams<{ key: string }>();
  const pubKey = decodeURIComponent(key);

  const avatars = useSelector((state: AppState) => state.avatars.avatars);
  const usernames = useSelector((state: AppState) => state.usernames.usernames);

  const [matchesList, setMatchesList] = useState<MatchData[]>([]);
  const matches = useRef<Record<string, MatchData>>({});

  const deboucer = useDebounce(200);

  const fetchAvatar = useFetchAvatar();
  const fetchUsername = useFetchUsername();

  useEffect(() => {
    if (pubKey) {
      fetchAvatar(pubKey);
      fetchUsername(pubKey);

      window.toolDb.queryKeys(`:${pubKey}.matches-`).then((matchesIndex) => {
        if (matchesIndex && matches.current) {
          console.log(matchesIndex);
          matchesIndex.forEach((id: string) => {
            getLocalDbValue<DbMatch>(id).then((dbm) => {
              if (dbm) {
                matches.current[id] = convertDbMatchToData(dbm);
                deboucer(() => setMatchesList(Object.values(matches.current)));
              } else {
                window.toolDb.getData<DbMatch>(id, false, 2000).then((data) => {
                  if (data) {
                    matches.current[id] = convertDbMatchToData(data);
                    deboucer(() =>
                      setMatchesList(Object.values(matches.current))
                    );
                  }
                });
              }
            });
          });
        }
      });
    }
  }, [pubKey, matches, deboucer]);

  const avatar = avatars[pubKey || DEFAULT_AVATAR];
  const username = usernames[pubKey || ""];

  return (
    <div className="user-view">
      <div className="top-container">
        <div
          title={decodeURIComponent(username)}
          className="avatar"
          style={{
            backgroundImage: `url(${avatar})`,
          }}
        />
        <h2 className="username">{decodeURIComponent(username)}</h2>
      </div>
      <UserHistoryList matchesData={matchesList} pubKey={pubKey || ""} />
    </div>
  );
}
