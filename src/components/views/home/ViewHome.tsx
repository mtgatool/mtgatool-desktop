import { useSelector } from "react-redux";
import { Fragment } from "react";

import { AppState } from "../../../redux/stores/rendererStore";

import { convertDbMatchToData } from "../history/getMatchesData";

import LiveFeedMatch from "./LiveFeedMatch";
import Section from "../../ui/Section";
import BestRanksFeed from "./BestRanksFeed";

export default function ViewHome() {
  const liveFeed = useSelector((state: AppState) => state.mainData.liveFeed);
  const liveFeedMatches = useSelector(
    (state: AppState) => state.mainData.liveFeedMatches
  );

  return (
    <>
      <Section style={{ marginTop: "16px", flexDirection: "column" }}>
        <h2 style={{ textAlign: "center", marginBottom: "16px" }}>
          Best Players
        </h2>
        <BestRanksFeed />
      </Section>
      <Section style={{ marginTop: "16px", flexDirection: "column" }}>
        {/* <div style={{ display: "flex" }}>
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
        </div> */}
        <h2 style={{ textAlign: "center" }}>Live Feed</h2>
        <div className="home-view">
          {liveFeed.map((matchId) => {
            const match = liveFeedMatches[matchId] || undefined;
            if (match) {
              const data = convertDbMatchToData(match);
              return (
                <LiveFeedMatch
                  key={`livefeed-match-${match.matchId}`}
                  match={data}
                />
              );
            }
            return <Fragment key={`livefeed-match-${matchId}`} />;
          })}
        </div>
      </Section>
    </>
  );
}
