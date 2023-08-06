/* eslint-disable no-param-reassign */

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import useFetchAvatar from "../../../hooks/useFetchAvatar";
import useFetchUsername from "../../../hooks/useFetchUsername";
import { AppState } from "../../../redux/stores/rendererStore";
import { getData } from "../../../toolDb/worker-wrapper";
import getEventExplorerSection from "../../../utils/getEventExplorerSection";
import getEventPrettyName from "../../../utils/getEventPrettyName";
import timeAgo from "../../../utils/timeAgo";
import { DbExploreAggregated } from "./doExploreAggregation";

interface ExploreEventProps {
  eventId: string;
}

export default function ExploreEvent(props: ExploreEventProps) {
  const { eventId } = props;
  const history = useHistory();

  const avatars = useSelector((state: AppState) => state.avatars.avatars);
  const usernames = useSelector((state: AppState) => state.usernames.usernames);

  const [eventData, setEventData] =
    useState<Partial<DbExploreAggregated> | null>(null);

  const fetchAvatar = useFetchAvatar();
  const fetchUsername = useFetchUsername();

  useEffect(() => {
    if (eventId && eventId !== "") {
      getData<Partial<DbExploreAggregated>>(`exploredata-${eventId}`).then(
        (d) => {
          if (d) {
            (d as any).size = Object.values(d.data || {}).length;
            setEventData(d);
            fetchUsername(d.aggregator || "");
            fetchAvatar(d.aggregator || "");
          }
        }
      );
    }
  }, [eventId]);

  return (
    <div
      className={`explore-event-list ${getEventExplorerSection(eventId)} ${
        eventData ? "" : "loading"
      }`}
      onClick={() => history.push(`/explore/${eventId}`)}
    >
      {eventData ? (
        <>
          <div className="event-name">
            <div className="evid">{getEventPrettyName(eventId)}</div>
            <div className="time">
              {(eventData as any).size} entries - {timeAgo(eventData?.to || 0)}
            </div>
          </div>
          <div className="name-container">
            <div className="name">{`${
              usernames[eventData.aggregator || ""]
            }`}</div>
            <div
              className="avatar"
              style={{
                backgroundImage: `url(${avatars[eventData.aggregator || ""]})`,
              }}
            />
          </div>
        </>
      ) : (
        <>
          <div className="event-name">
            <div className="evid loading">a</div>
            <div className="time loading">a</div>
          </div>
          <div className="name-container">
            <div className="name loading">a</div>
            <div
              className="avatar"
              style={{
                backgroundImage: `url()`,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
