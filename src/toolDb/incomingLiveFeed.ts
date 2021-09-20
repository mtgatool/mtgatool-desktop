import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { DbMatch } from "../types/dbTypes";

export default function incomingLiveFeed(match: DbMatch | null) {
  const { dispatch } = store;

  if (match) {
    reduxAction(dispatch, {
      type: "ADD_LIVEFEED",
      arg: match,
    });
  }
}
