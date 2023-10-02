import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import { DEFAULT_AVATAR } from "../constants";
import reduxAction from "../redux/reduxAction";
import { AppState } from "../redux/stores/rendererStore";
import { getData } from "../toolDb/worker-wrapper";
import globalData from "../utils/globalData";

export default function useFetchAvatar() {
  const dispatch = useDispatch();
  const avatars = useSelector((state: AppState) => state.avatars.avatars);

  const fetchAvatar = useCallback(
    (pubKey: string) => {
      globalData.fetchedAvatars.push(pubKey);
      return new Promise<string>((resolve, reject) => {
        if (!avatars[pubKey]) {
          reduxAction(dispatch, {
            type: "SET_AVATAR",
            arg: { pubKey, avatar: "" },
          });
          getData<string>(`:${pubKey}.avatar`, false, 1000)
            .then((avatar) => {
              reduxAction(dispatch, {
                type: "SET_AVATAR",
                arg: { pubKey, avatar: avatar || DEFAULT_AVATAR },
              });
              resolve(avatar || DEFAULT_AVATAR);
            })
            .catch(reject);
        } else {
          resolve(avatars[pubKey]);
        }
      });
    },
    [avatars, dispatch]
  );

  return fetchAvatar;
}
