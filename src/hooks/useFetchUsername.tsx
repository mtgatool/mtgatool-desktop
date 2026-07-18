import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import { getData } from "../data/store";
import reduxAction from "../redux/reduxAction";
import { AppState } from "../redux/stores/rendererStore";
import cleanUsername from "../utils/cleanUsername";

export default function useFetchUsername() {
  const dispatch = useDispatch();
  const usernames = useSelector((state: AppState) => state.usernames.usernames);

  const fetchUsername = useCallback(
    (key: string) => {
      return new Promise<string>((resolve, reject) => {
        if (!usernames[key]) {
          reduxAction(dispatch, {
            type: "SET_USERNAME",
            arg: { key, username: "" },
          });
          getData<string>(`:${key}.username`, false, 1000)
            .then((username) => {
              reduxAction(dispatch, {
                type: "SET_USERNAME",
                arg: { key, username: cleanUsername(username || "") },
              });
              resolve(cleanUsername(username || ""));
            })
            .catch(reject);
        } else {
          resolve(cleanUsername(usernames[key]));
        }
      });
    },
    [usernames, dispatch]
  );

  return fetchUsername;
}
