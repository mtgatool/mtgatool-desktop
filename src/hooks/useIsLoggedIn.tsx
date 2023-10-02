import { useSelector } from "react-redux";

import { LOGIN_OK } from "../constants";
import { AppState } from "../redux/stores/rendererStore";

export default function useIsLoggedIn(): boolean {
  const loginState = useSelector(
    (state: AppState) => state.renderer.loginState
  );

  return loginState === LOGIN_OK;
}
