import reduxAction from "../redux/reduxAction";
import { setCards } from "../redux/slices/mainDataSlice";
import store from "../redux/stores/rendererStore";
import { DbUUIDData } from "../types/dbTypes";

import getLocalDbValue from "./getLocalDbValue";

function handleDecksIndex(data: Record<string, number> | undefined) {
  if (data) {
    Object.keys(data).forEach((id: string) => {
      if (
        !Object.keys(store.getState().mainData.decksIndex).includes(
          `${id}-v${data[id]}`
        )
      ) {
        window.toolDb.getData(`decks-${id}-v${data[id]}`, true, 5000);
      }
    });

    reduxAction(store.dispatch, {
      type: "SET_DECKS_INDEX",
      arg: data,
    });
    console.log("decksIndex", data);
  }
}

function handleMatchesIndex(data: string[] | undefined) {
  if (data) {
    data.forEach((id: string) => {
      if (!store.getState().mainData.matchesIndex.includes(id)) {
        window.toolDb.getData(`matches-${id}`, true, 5000);
      }
    });

    reduxAction(store.dispatch, {
      type: "SET_MATCHES_INDEX",
      arg: data,
    });

    console.log("matchesIndex", data);
  }
}

export function afterLogin() {
  const { dispatch } = store;
  const pubKey = window.toolDb.user?.pubKey || "";
  // window.toolDb.addKeyListener(`:${pubKey}.matches-`, (data) => {
  //   if (data) {
  //     reduxAction(dispatch, {
  //       type: "SET_MATCH",
  //       arg: data,
  //     });
  //   }
  // });

  // window.toolDb.addKeyListener(`:${pubKey}.decks-`, (data) => {
  //   if (data) {
  //     reduxAction(dispatch, {
  //       type: "SET_DECK",
  //       arg: data,
  //     });
  //   }
  // });

  window.toolDb.addKeyListener(`:${pubKey}.matchesIndex`, handleMatchesIndex);

  window.toolDb.addKeyListener(`:${pubKey}.decksIndex`, handleDecksIndex);

  window.toolDb.getData("matchesIndex", true, 5000).catch(console.warn);

  window.toolDb.getData("decksIndex", true, 5000).catch(console.warn);

  getLocalDbValue<string[]>(`:${pubKey}.matchesIndex`).then(handleMatchesIndex);

  getLocalDbValue<Record<string, number>>(`:${pubKey}.decksIndex`).then(
    handleDecksIndex
  );

  window.toolDb
    .getData("userids", true, 5000)
    .then((data) => {
      console.log("Userids", data);
      let newest = "";
      let newestDate = 0;
      Object.keys(data).forEach((uuid) => {
        if (data[uuid] > newestDate) {
          newestDate = data[uuid];
          newest = uuid;
        }
        window.toolDb
          .getData<DbUUIDData>(`${uuid}-data`, true, 5000)
          .then((uuidData) => {
            if (uuidData) {
              reduxAction(dispatch, {
                type: "SET_UUID_DATA",
                arg: { data: uuidData, uuid },
              });
            }
          })
          .catch(console.warn);

        reduxAction(dispatch, {
          type: "SET_UUID",
          arg: newest,
        });
      });
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
