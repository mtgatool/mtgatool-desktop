import { Route, Switch, useRouteMatch } from "react-router-dom";

import useIsLoggedIn from "../../../hooks/useIsLoggedIn";
import { MatchData } from "../history/convertDbMatchData";
import DraftsHome from "./DraftsHome";
import DraftView from "./DraftView";

interface ViewDraftsProps {
  matchesData: MatchData[];
  datePickerDoShow: () => void;
}

export default function ViewDrafts(props: ViewDraftsProps) {
  const { matchesData, datePickerDoShow } = props;
  const { url } = useRouteMatch();
  const loggedIn = useIsLoggedIn();

  // No shared Section here: the list wraps itself, and the replay view lays
  // out its own header/pack/picked sections.
  return (
    <>
      {loggedIn && (
        <Switch>
          <Route exact path={`${url}/:id`} component={DraftView} />
          <Route
            exact
            path={`${url}/`}
            render={() => (
              <DraftsHome
                matchesData={matchesData}
                datePickerDoShow={datePickerDoShow}
              />
            )}
          />
        </Switch>
      )}
    </>
  );
}
