import { useHistory } from "react-router-dom";

import logoBig from "../assets/images/logo_big.png";
import openExternal from "../utils/openExternal";
import Button from "./ui/Button";

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
      <div
        className="public-top-bar-brand"
        onClick={(): void => openExternal("https://mtgatool.com")}
      >
        <img src={logoBig} alt="MTG Arena Tool" />
      </div>
      <div className="public-top-bar-actions">
        <Button
          className="button-simple"
          text="Log in"
          onClick={(): void =>
            history.push("/auth", {
              returnTo:
                history.location.pathname + (history.location.search || ""),
            })
          }
        />
        <Button
          className="button-simple"
          text="Get the tracker"
          onClick={(): void => openExternal("https://mtgatool.com")}
        />
      </div>
    </div>
  );
}
