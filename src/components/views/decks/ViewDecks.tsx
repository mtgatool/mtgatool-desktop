import { useState } from "react";
import { useSelector } from "react-redux";
import { Route, Switch, useRouteMatch } from "react-router-dom";

import useIsLoggedIn from "../../../hooks/useIsLoggedIn";
import { AppState } from "../../../redux/stores/rendererStore";
import Deck from "../../../utils/mtga/deck";
import Section from "../../ui/Section";
import DecksList from "./DecksList";
import DeckView from "./DeckView";
import SavedDecksList from "./SavedDecksList";

interface ViewDecksProps {
  openHistoryStatsPopup: () => void;
  datePickerDoShow: () => void;
  openDeckView: (deck: Deck) => void;
}

type DecksTab = "played" | "saved";

export default function ViewDecks(props: ViewDecksProps) {
  const { url } = useRouteMatch();
  const loggedIn = useIsLoggedIn();

  const { openHistoryStatsPopup, datePickerDoShow, openDeckView } = props;

  const decksIndex = useSelector(
    (state: AppState) => state.mainData.decksIndex
  );

  const [tab, setTab] = useState<DecksTab>("played");

  if (!loggedIn || !decksIndex) return <></>;

  return (
    <Switch>
      <Route exact path={`${url}/:id`}>
        <DeckView openDeckView={openDeckView} />
      </Route>
      <Route exact path={`${url}/`}>
        <>
          <Section style={{ marginTop: "16px", gap: "8px" }}>
            {(["played", "saved"] as DecksTab[]).map((t) => (
              <div
                key={t}
                onClick={() => setTab(t)}
                className={`overlay-settings-nav ${
                  tab === t ? "item-selected" : ""
                }`}
                style={{ cursor: "pointer" }}
              >
                {t === "played" ? "Played decks" : "Saved decks"}
              </div>
            ))}
          </Section>
          {tab === "played" ? (
            <DecksList
              datePickerDoShow={datePickerDoShow}
              openHistoryStatsPopup={openHistoryStatsPopup}
            />
          ) : (
            <SavedDecksList active />
          )}
        </>
      </Route>
    </Switch>
  );
}
