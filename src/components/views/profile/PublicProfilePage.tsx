import { useEffect, useState } from "react";

import logoBig from "../../../assets/images/logo_big.png";
import cardsDb from "../../../utils/cardsDb/cardsDbClient";
import PublicLoading from "../../PublicLoading";
import PublicTopBar from "../../PublicTopBar";
import ViewProfile from "./ViewProfile";

/**
 * Standalone shell for /profile/<id> when nobody is signed in — a shared
 * profile link must work like a shared deck link does. Everything the
 * profile shows comes from anon-callable RPCs; the shell only has to load
 * the cards database (normally done by the login flow) and provide a
 * scrollable page for the same ViewProfile the app renders.
 */
export default function PublicProfilePage(): JSX.Element {
  const [dbReady, setDbReady] = useState(false);
  const [dbFailed, setDbFailed] = useState(false);

  useEffect(() => {
    cardsDb
      .init()
      .then((ready) => (ready ? setDbReady(true) : setDbFailed(true)))
      .catch(() => setDbFailed(true));
  }, []);

  if (dbFailed) {
    return (
      <div className="shared-deck-missing">
        <img src={logoBig} alt="MTG Arena Tool" />
        <div>Could not load the card database — try reloading the page.</div>
      </div>
    );
  }

  if (!dbReady) {
    return <PublicLoading label="Loading profile…" />;
  }

  return (
    <div className="public-profile-page">
      <PublicTopBar />
      <ViewProfile />
    </div>
  );
}
