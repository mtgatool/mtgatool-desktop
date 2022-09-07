import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import reduxAction from "../redux/reduxAction";

import { AppState } from "../redux/stores/rendererStore";
import cleanUsername from "../utils/cleanUsername";

export default function useFetchUsername() {
  const dispatch = useDispatch();
  const usernames = useSelector((state: AppState) => state.usernames.usernames);

  const fetchAvatar = useCallback(
    (pubKey: string) => {
      if (!usernames[pubKey]) {
        reduxAction(dispatch, {
          type: "SET_USERNAME",
          arg: { pubKey, username: "" },
        });
      }
      window.toolDb.getData<string>(`:${pubKey}.username`).then((username) => {
        reduxAction(dispatch, {
          type: "SET_USERNAME",
          arg: { pubKey, username: cleanUsername(username || "") },
        });
      });
    },
    [usernames, dispatch]
  );

  return fetchAvatar;
}
