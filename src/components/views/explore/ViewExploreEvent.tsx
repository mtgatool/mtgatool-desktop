/* eslint-disable radix */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-props-no-spreading */

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useHistory, useParams } from "react-router-dom";

import useFetchAvatar from "../../../hooks/useFetchAvatar";
import useFetchUsername from "../../../hooks/useFetchUsername";
import { AppState } from "../../../redux/stores/rendererStore";
import getEventPrettyName from "../../../utils/getEventPrettyName";
import Flex from "../../Flex";
import Button from "../../ui/Button";
import Section from "../../ui/Section";
import { DbExploreAggregated, ExploreDeckData } from "./doExploreAggregation";
import ExploreDeckView from "./ExploreDeckView";
import {
  MODE_DECKVIEW,
  MODE_EXPLORE_CARDS,
  MODE_EXPLORE_DECKS,
  Modes,
} from "./ExploreTypes";
import ViewExploreCards from "./ViewExploreCards";
import ViewExploreDecks from "./ViewExploreDecks";

export default function ViewExploreEvent() {
  const params = useParams<{ id: string }>();
  const history = useHistory();

  const [mode, setMode] = useState<Modes>(MODE_EXPLORE_DECKS);
  const [currentDeck, setCurrentDeck] = useState<ExploreDeckData | null>(null);

  const avatars = useSelector((state: AppState) => state.avatars.avatars);
  const usernames = useSelector((state: AppState) => state.usernames.usernames);

  const [data, setData] = useState<DbExploreAggregated | null>(null);

  const fetchAvatar = useFetchAvatar();
  const fetchUsername = useFetchUsername();

  useEffect(() => {
    window.toolDb
      .getData<DbExploreAggregated>(`exploredata-${params.id}`)
      .then((d) => {
        if (d) {
          setData(d);
          fetchUsername(d.aggregator);
          fetchAvatar(d.aggregator);
        }
      });
  }, [params]);

  return (
    <>
      <Section style={{ margin: "16px 0", flexDirection: "column" }}>
        <Flex
          style={{
            textAlign: "center",
            flexDirection: "column",
            lineHeight: "32px",
          }}
        >
          {data && (
            <>
              <h2>{getEventPrettyName(params.id)}</h2>
              <i>
                Results shown range between {new Date(data.from).toDateString()}{" "}
                and {new Date(data.to).toDateString()}
              </i>
              <div className="maker-container">
                <i className="maker-name">Pushed by</i>
                <i
                  className="maker-name link"
                  style={{ margin: "0 0 0 4px" }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    history.push(
                      `/user/${encodeURIComponent(data.aggregator || "")}`
                    );
                  }}
                >
                  {usernames[data.aggregator]}
                </i>
                <div
                  className="maker-avatar"
                  style={{
                    backgroundImage: `url(${avatars[data.aggregator]})`,
                  }}
                />
              </div>
            </>
          )}
        </Flex>
        <Flex
          style={{
            marginTop: "16px",
            justifyContent: "space-between",
          }}
        >
          <Button onClick={() => history.push(`/explore`)} text="Go Back" />
          <Button
            disabled={mode === MODE_EXPLORE_DECKS}
            onClick={() => setMode(MODE_EXPLORE_DECKS)}
            text="View Decks"
          />
          <Button
            disabled={mode === MODE_EXPLORE_CARDS}
            onClick={() => setMode(MODE_EXPLORE_CARDS)}
            text="View Cards"
          />
        </Flex>
      </Section>
      {mode === MODE_EXPLORE_DECKS && (
        <>
          {data ? (
            <ViewExploreDecks
              data={data}
              setMode={setMode}
              setCurrentDeck={setCurrentDeck}
            />
          ) : (
            <></>
          )}
        </>
      )}
      {mode === MODE_EXPLORE_CARDS &&
        (data ? <ViewExploreCards data={data} setMode={setMode} /> : <></>)}
      {mode === MODE_DECKVIEW && currentDeck && (
        <ExploreDeckView
          data={currentDeck}
          goBack={() => setMode(MODE_EXPLORE_DECKS)}
        />
      )}
    </>
  );
}
