import { useState } from "react";
import { useSelector } from "react-redux";
import { Route, Switch, useRouteMatch } from "react-router-dom";

import useIsLoggedIn from "../../../hooks/useIsLoggedIn";
import { AppState } from "../../../redux/stores/rendererStore";
import Deck from "../../../utils/mtga/deck";
import SegmentedToggle from "../../ui/SegmentedToggle";
import DecksList from "./DecksList";
import DeckView from "./DeckView";

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
        {/* One DecksList for both tabs: the filter chrome (and the toggle
            itself) stays mounted, so the thumb animates and only the deck
            content below swaps. */}
        <DecksList
          tab={tab}
          datePickerDoShow={datePickerDoShow}
          openHistoryStatsPopup={openHistoryStatsPopup}
          tabsToggle={
            <DecksTabToggle tab={tab} setTab={setTab} margin="auto 0" />
          }
        />
      </Route>
    </Switch>
  );
}
