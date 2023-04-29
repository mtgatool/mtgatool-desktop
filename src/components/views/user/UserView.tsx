import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { DEFAULT_AVATAR } from "../../../constants";
import useDebounce from "../../../hooks/useDebounce";
import useFetchAvatar from "../../../hooks/useFetchAvatar";
import useFetchPubKey from "../../../hooks/useFetchPubKey";
import { AppState } from "../../../redux/stores/rendererStore";
import getLocalDbValue from "../../../toolDb/getLocalDbValue";
import { DbMatch } from "../../../types/dbTypes";
import { convertDbMatchToData, MatchData } from "../history/getMatchesData";
import UserHistoryList from "./UserHistoryList";

export default function UserView() {
  const { username } = useParams<{ username: string }>();
  const pubKey = useFetchPubKey(decodeURIComponent(username));

  const avatars = useSelector((state: AppState) => state.avatars.avatars);

  const [matchesList, setMatchesList] = useState<MatchData[]>([]);
  const matches = useRef<Record<string, MatchData>>({});

  const deboucer = useDebounce(200);

  const fetchAvatar = useFetchAvatar();

  useEffect(() => {
    if (pubKey) {
      fetchAvatar(pubKey);

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
