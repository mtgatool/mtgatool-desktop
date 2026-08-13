import { useHistory } from "react-router-dom";

import logoBig from "../assets/images/logo_big.png";
import { setLoginReturnTo } from "../utils/loginReturnTo";
import openExternal from "../utils/openExternal";

/**
 * Slim chrome for the signed-out public pages: brand on the left, two honest
 * actions on the right. Deliberately NOT the app's TopNav with placeholders —
 * a bar full of tabs that all bounce to a login wall reads as broken; this
 * one only offers what actually works signed out.
 */
export default function PublicTopBar(): JSX.Element {
  const history = useHistory();

  return (
    <div className="public-top-bar">
      <button
        type="button"
        className="public-top-bar-brand"
        onClick={(): void => openExternal("https://mtgatool.com")}
      >
        <img src={logoBig} alt="MTG Arena Tool" />
      </button>
      <div className="public-top-bar-actions">
        {/* Native buttons: the shared Button renders a div and offers no
            keyboard semantics. .button-simple styles apply the same. */}
        <button
          type="button"
          className="button-simple"
          onClick={(): void => {
            const returnTo =
              history.location.pathname + (history.location.search || "");
            setLoginReturnTo(returnTo);
            history.push("/auth", { returnTo });
          }}
        >
          Log in
        </button>
        <button
          type="button"
          className="button-simple"
          onClick={(): void => openExternal("https://mtgatool.com")}
        >
          Get the tracker
        </button>
      </div>
    </div>
  );
}
