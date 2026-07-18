import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import { DEFAULT_AVATAR } from "../constants";
import { getData } from "../data/store";
import reduxAction from "../redux/reduxAction";
import { AppState } from "../redux/stores/rendererStore";
import globalData from "../utils/globalData";

export default function useFetchAvatar() {
  const dispatch = useDispatch();
  const avatars = useSelector((state: AppState) => state.avatars.avatars);

  const fetchAvatar = useCallback(
    (key: string) => {
      globalData.fetchedAvatars.push(key);
      return new Promise<string>((resolve, reject) => {
        if (!avatars[key]) {
          reduxAction(dispatch, {
            type: "SET_AVATAR",
            arg: { key, avatar: "" },
          });
          getData<string>(`:${key}.avatar`, false, 1000)
            .then((avatar) => {
              reduxAction(dispatch, {
                type: "SET_AVATAR",
                arg: { key, avatar: avatar || DEFAULT_AVATAR },
              });
              resolve(avatar || DEFAULT_AVATAR);
            })
            .catch(reject);
        } else {
          resolve(avatars[key]);
        }
      });
    },
    [avatars, dispatch]
  );

  return fetchAvatar;
}
