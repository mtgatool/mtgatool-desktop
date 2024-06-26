import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { DEFAULT_AVATAR } from "../../../constants";
import useDebounce from "../../../hooks/useDebounce";
import useFetchAvatar from "../../../hooks/useFetchAvatar";
import useFetchUsername from "../../../hooks/useFetchUsername";
import { AppState } from "../../../redux/stores/rendererStore";
import { doFunction, getData } from "../../../toolDb/worker-wrapper";
import { DbRankData } from "../../../types/dbTypes";
import Section from "../../ui/Section";
import { MatchData } from "../history/convertDbMatchData";
import UserHistoryList from "./UserHistoryList";
import UserRank from "./UserRank";

export default function UserView() {
  const { key } = useParams<{ key: string }>();

  const [pubKey, setPubKey] = useState(decodeURIComponent(key));
  const [rankData, setRankData] = useState<DbRankData | null>(null);

  useEffect(() => {
    const decoded = decodeURIComponent(key);
    if (!decoded.startsWith("MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE")) {
      getData(`==${decoded}`).then((userData) => {
        if (userData) {
          setPubKey(userData.keys.skpub);
        }
      });
    }
  }, [key]);

  const avatars = useSelector((state: AppState) => state.avatars.avatars);
  const usernames = useSelector((state: AppState) => state.usernames.usernames);

  const [matchesList, setMatchesList] = useState<MatchData[]>([]);
  const matches = useRef<Record<string, MatchData>>({});

  const deboucer = useDebounce(200);

  const fetchAvatar = useFetchAvatar();
  const fetchUsername = useFetchUsername();

  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (pubKey) {
      fetchAvatar(pubKey);
      fetchUsername(pubKey);

      getData(`:${pubKey}.privateMode`).then((privateMode) => {
        setIsPrivate(!!privateMode);
        if (!privateMode) {
          getData(`:${pubKey}.userids`).then((data) => {
            if (data) {
              let newest = "";
              let newestDate = 0;
              Object.keys(data).forEach((uuid) => {
                if (uuid && uuid !== "undefined" && data[uuid] > newestDate) {
                  newestDate = data[uuid];
                  newest = uuid;
                }
              });

              doFunction<string>(
                "getLatestMatches",
                {
                  pubKey: pubKey,
                  items: 10,
                },
                99999
              ).then((d) => {
                if (d && d.code === "OK" && d.return) {
                  setMatchesList(d.return as any);
                }
              });

              getData<DbRankData>(`:${pubKey}.${newest}-rank`).then((rd) => {
                if (rd) {
                  setRankData(rd);
                }
              });
            }
          });
        }
      });
    }
  }, [pubKey, matches, deboucer]);

  const avatar = avatars[pubKey || DEFAULT_AVATAR];
  const username = usernames[pubKey || ""];

  return (
    <>
      <Section style={{ marginTop: "16px" }}>
        <div className="user-view">
          <div className="top-container">
            <div className="top-userdata">
              <div
                title={decodeURIComponent(username)}
                className="avatar"
                style={{
                  backgroundImage: `url(${avatar})`,
                }}
              />
              <h2 className="username">{decodeURIComponent(username)}</h2>
            </div>
            {isPrivate ? (
              <h3 style={{ color: "var(--color-r)", margin: "auto 0" }}>
                User profile is private
              </h3>
            ) : null}
            {rankData && (
              <div className="top-ranks">
                <UserRank
                  rank={rankData}
                  type="constructed"
                  rankClass="top-constructed-rank"
                />
                <UserRank
                  rank={rankData}
                  type="limited"
                  rankClass="top-limited-rank"
                />
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section style={{ marginTop: "16px" }}>
        <UserHistoryList matchesData={matchesList} pubKey={pubKey || ""} />
      </Section>
    </>
  );
}
