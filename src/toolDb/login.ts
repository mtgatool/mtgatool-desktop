import reduxAction from "../redux/reduxAction";
import { setCards } from "../redux/slices/mainDataSlice";
import store from "../redux/stores/rendererStore";
import { DbUUIDData } from "../types/dbTypes";
import getLocalSetting from "../utils/getLocalSetting";

export function afterLogin() {
  const { dispatch } = store;
  window.toolDb
    .getData("matchesIndex", true)
    .then((data) => {
      reduxAction(dispatch, {
        type: "SET_MATCHES_INDEX",
        arg: data,
      });

      data.forEach((id: string) => {
        window.toolDb.getData(`matches-${id}`, true).then((match) => {
          console.log(`matches-${id}`, match);
          reduxAction(dispatch, {
            type: "SET_MATCH",
            arg: match,
          });
        });
      });
      console.log("matchesIndex", data);
    })
    .catch(console.warn);

  window.toolDb
    .getData("decksIndex", true)
    .then((data) => {
      reduxAction(dispatch, {
        type: "SET_DECKS_INDEX",
        arg: data,
      });

      Object.keys(data).forEach((id: string) => {
        window.toolDb.getData(`decks-${id}-v${data[id]}`, true).then((deck) => {
          console.log(`decks-${id}-v${data[id]}`, deck);
          reduxAction(dispatch, {
            type: "SET_DECK",
            arg: deck,
          });
        });
      });
      console.log("decksIndex", data);
    })
    .catch(console.warn);

  window.toolDb
    .getData<DbUUIDData>(`${getLocalSetting("playerId")}-data`, true)
    .then((data) => {
      console.log("player data", data);
      if (data) {
        reduxAction(dispatch, {
          type: "SET_UUID_DATA",
          arg: data,
        });
      }
    })
    .catch(console.warn);

  window.toolDb
    .getData("cards", true)
    .then((data) => {
      setCards(data);
      console.log("cards", data);
    })
    .catch(console.warn);
}

export default function login(username: string, password: string) {
  return window.toolDb.signIn(username, password).then((keys) => {
    afterLogin();
    return keys;
  });
}
