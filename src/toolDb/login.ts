import reduxAction from "../redux/reduxAction";
import { setCards } from "../redux/slices/mainDataSlice";
import store from "../redux/stores/rendererStore";

export default function login(username: string, password: string) {
  const { dispatch } = store;
  return window.toolDb.signIn(username, password).then((keys) => {
    window.toolDb
      .getData("matchesIndex", true)
      .then((data) => {
        reduxAction(dispatch, {
          type: "SET_MATCHES_INDEX",
          arg: data,
        });

        data.forEach((id: string) => {
          window.toolDb.getData(`matches-${id}`, true).then((match) => {
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
          window.toolDb
            .getData(`decks-${id}-v${data[id]}`, true)
            .then((deck) => {
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
      .getData("uuidData", true)
      .then((data) => console.log("uuidData", data))
      .catch(console.warn);

    window.toolDb
      .getData("cards", true)
      .then((data) => {
        setCards(data);
        console.log("cards", data);
      })
      .catch(console.warn);
    return keys;
  });
}
