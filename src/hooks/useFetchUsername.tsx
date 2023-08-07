import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import reduxAction from "../redux/reduxAction";
import { AppState } from "../redux/stores/rendererStore";
import { getData } from "../toolDb/worker-wrapper";
import cleanUsername from "../utils/cleanUsername";

export default function useFetchUsername() {
  const dispatch = useDispatch();
  const usernames = useSelector((state: AppState) => state.usernames.usernames);

  const fetchAvatar = useCallback(
    (pubKey: string) => {
      return new Promise<string>((resolve, reject) => {
        if (!usernames[pubKey]) {
          reduxAction(dispatch, {
            type: "SET_USERNAME",
            arg: { pubKey, username: "" },
          });
          getData<string>(`:${pubKey}.username`, false, 1000)
            .then((username) => {
              reduxAction(dispatch, {
                type: "SET_USERNAME",
                arg: { pubKey, username: cleanUsername(username || "") },
              });
              resolve(cleanUsername(username || ""));
            })
            .catch(reject);
        } else {
          resolve(cleanUsername(usernames[pubKey]));
        }
      });
    },
    [usernames, dispatch]
  );

  return fetchAvatar;
}
