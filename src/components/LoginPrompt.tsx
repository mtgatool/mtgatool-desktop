import { useHistory } from "react-router-dom";

import useIsLoggedIn from "../hooks/useIsLoggedIn";
import { setLoginReturnTo } from "../utils/loginReturnTo";
import Section from "./ui/Section";

/**
 * "Log in to compare against your collection!" — shown on public deck and
 * match pages to signed-out viewers, whose empty collection would otherwise
 * make every card look uncrafted. Logging in returns to the page it was
 * clicked from.
 */
export default function LoginPrompt(): JSX.Element | null {
  const loggedIn = useIsLoggedIn();
  const history = useHistory();

  if (loggedIn) return null;

  return (
    <Section
      style={{
        padding: "12px 16px",
        margin: "16px 0 0",
        justifyContent: "center",
      }}
    >
      <div className="login-prompt">
        <button
          type="button"
          className="login-prompt-link"
          onClick={(): void => {
            const returnTo =
              history.location.pathname + (history.location.search || "");
            setLoginReturnTo(returnTo);
            history.push("/auth", { returnTo });
          }}
        >
          Log in
        </button>{" "}
        to compare against your collection!
      </div>
    </Section>
  );
}
