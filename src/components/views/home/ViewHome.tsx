import { useSelector } from "react-redux";

import { Fragment } from "react";
import postChannelMessage from "../../../broadcastChannel/postChannelMessage";
import Button from "../../ui/Button";
import createOverlay from "../../../overlay/createOverlay";

import { AppState } from "../../../redux/stores/rendererStore";
import getCssQuality from "../../../utils/getCssQuality";
import { convertDbMatchToData } from "../history/getMatchesData";
import ListItemMatch from "../history/ListItemMatch";

export default function ViewHome() {
  const liveFeed = useSelector((state: AppState) => state.mainData.liveFeed);
  const liveFeedMatches = useSelector(
    (state: AppState) => state.mainData.liveFeedMatches
  );

  return (
    <>
      <div
        className={`section ${getCssQuality()}`}
        style={{ flexDirection: "column" }}
      >
        <div style={{ display: "flex" }}>
          <Button
            style={{
              margin: "auto",
            }}
            onClick={() => {
              postChannelMessage({
                type: "START_LOG_READING",
              });
            }}
            text="Re-read log"
          />
          <Button
            style={{
              margin: "auto",
            }}
            onClick={() =>
              createOverlay(0).then(() => console.log("closeddd!"))
            }
            text="Test overaly"
          />
        </div>
        <h2 style={{ textAlign: "center" }}>Live Feed</h2>
        <div className="home-view">
          {liveFeed.map((matchId) => {
            const match = liveFeedMatches[matchId] || undefined;
            if (match) {
              const data = convertDbMatchToData(match);
              return (
                <ListItemMatch
                  key={`livefeed-match-${match.matchId}`}
                  match={data}
                />
              );
            }
            return <Fragment key={`livefeed-match-${matchId}`} />;
          })}
        </div>
      </div>
    </>
  );
}
