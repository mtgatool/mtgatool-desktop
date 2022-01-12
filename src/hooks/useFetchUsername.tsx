import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import reduxAction from "../redux/reduxAction";

import { AppState } from "../redux/stores/rendererStore";

export default function useFetchUsername() {
  const dispatch = useDispatch();
  const usernames = useSelector((state: AppState) => state.usernames.usernames);

  const fetchAvatar = useCallback(
    (pubKey: string) => {
      reduxAction(dispatch, {
        type: "SET_USERNAME",
        arg: { pubKey, username: "" },
      });
      window.toolDb.getData<string>(`:${pubKey}.username`).then((username) => {
        reduxAction(dispatch, {
          type: "SET_USERNAME",
          arg: { pubKey, username: username || "" },
        });
      });
    },
    [usernames, dispatch]
  );

  return fetchAvatar;
}
