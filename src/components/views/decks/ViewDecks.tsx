import { useState } from "react";
import { useSelector } from "react-redux";
import { Route, Switch, useRouteMatch } from "react-router-dom";

import useIsLoggedIn from "../../../hooks/useIsLoggedIn";
import { AppState } from "../../../redux/stores/rendererStore";
import Deck from "../../../utils/mtga/deck";
import Section from "../../ui/Section";
import SegmentedToggle from "../../ui/SegmentedToggle";
import DecksList from "./DecksList";
import DeckView from "./DeckView";
import SavedDecksList from "./SavedDecksList";

interface ViewDecksProps {
  openHistoryStatsPopup: () => void;
  datePickerDoShow: () => void;
  openDeckView: (deck: Deck) => void;
}

type DecksTab = "played" | "saved";

function DecksTabToggle({
  tab,
  setTab,
  margin,
}: {
  tab: DecksTab;
  setTab: (tab: DecksTab) => void;
  margin: string;
}): JSX.Element {
  return (
    <SegmentedToggle
      options={[
        ["played", "Played decks"],
        ["saved", "Saved decks"],
      ]}
      value={tab}
      onChange={setTab}
      style={{ margin }}
    />
  );
}

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
        {/* Played decks merges this into the filter section; Saved decks has
            no filters, so the toggle gets a slim section of its own. */}
        {tab === "played" ? (
          <DecksList
            datePickerDoShow={datePickerDoShow}
            openHistoryStatsPopup={openHistoryStatsPopup}
            tabsToggle={
              <DecksTabToggle tab={tab} setTab={setTab} margin="auto 0" />
            }
          />
        ) : (
          <>
            <Section style={{ marginTop: "16px" }}>
              <DecksTabToggle tab={tab} setTab={setTab} margin="0" />
            </Section>
            <SavedDecksList active />
          </>
        )}
      </Route>
    </Switch>
  );
}
