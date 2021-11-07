import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DEFAULT_AVATAR } from "../constants";
import reduxAction from "../redux/reduxAction";

import { AppState } from "../redux/stores/rendererStore";

export default function useFetchAvatar() {
  const dispatch = useDispatch();
  const avatars = useSelector((state: AppState) => state.avatars.avatars);

  const fetchAvatar = useCallback(
    (pubKey: string) => {
      reduxAction(dispatch, {
        type: "SET_AVATAR",
        arg: { pubKey, avatar: "" },
      });
      window.toolDb.getData<string>(`:${pubKey}.avatar`).then((avatar) => {
        reduxAction(dispatch, {
          type: "SET_AVATAR",
          arg: { pubKey, avatar: avatar || DEFAULT_AVATAR },
        });
      });
    },
    [avatars, dispatch]
  );

  return fetchAvatar;
}
