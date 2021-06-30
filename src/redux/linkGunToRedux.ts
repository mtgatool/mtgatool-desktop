import getGraphObjectFromPartial from "../gun/getGraphObjectFromPartial";
import getGunUser from "../gun/getGunUser";
import { GunDeck, GunMatch, GunUser } from "../types/gunTypes";
import reduxAction from "./reduxAction";
import store from "./stores/rendererStore";

export default function linkGunToRedux() {
  const { dispatch } = store;
  const userRef = getGunUser();
  if (userRef) {
    // Create listeners for Gun's Graph api
    // These will check against the internal Graph data for new data and push directly to redux
    // This is done so we minimioze queries to the graph, so its Superfast!
    let decksDebouncer: NodeJS.Timeout | null = null;
    userRef.get("decks").on(
      (data: any) => {
        if (decksDebouncer) clearTimeout(decksDebouncer);
        decksDebouncer = setTimeout(async () => {
          const object = await getGraphObjectFromPartial<
            Record<string, GunDeck>
          >(data);

          if (object) {
            console.log("SET_DECKS", Object.keys(object));
            reduxAction(dispatch, {
              type: "SET_DECKS",
              arg: object,
            });
          }
        }, 1000);
      },
      {
        change: true,
      }
    );

    let matchesDebouncer: NodeJS.Timeout | null = null;
    userRef.get("matches").on(
      (data: any) => {
        if (matchesDebouncer) clearTimeout(matchesDebouncer);
        matchesDebouncer = setTimeout(async () => {
          const object = await getGraphObjectFromPartial<
            Record<string, GunMatch>
          >(data);

          if (object) {
            console.log("SET_MATCHES", Object.keys(object));
            reduxAction(dispatch, {
              type: "SET_MATCHES",
              arg: object,
            });
          }
        }, 1000);
      },
      {
        change: true,
      }
    );

    let uuiddataDebouncer: NodeJS.Timeout | null = null;
    userRef.get("uuidData").on(
      (data: any) => {
        if (uuiddataDebouncer) clearTimeout(uuiddataDebouncer);
        uuiddataDebouncer = setTimeout(async () => {
          const object = await getGraphObjectFromPartial<GunUser["uuidData"]>(
            data
          );

          if (object) {
            console.log("SET_ALL_UUID_DATA", Object.keys(object));
            reduxAction(dispatch, {
              type: "SET_ALL_UUID_DATA",
              arg: object,
            });
          }
        }, 1000);
      },
      {
        change: true,
      }
    );

    let decksIndexDebouncer: NodeJS.Timeout | null = null;
    userRef.get("decksIndex").on((d: any) => {
      // eslint-disable-next-line no-param-reassign
      if (decksIndexDebouncer) clearTimeout(decksIndexDebouncer);
      decksIndexDebouncer = setTimeout(async () => {
        const data = { ...d };
        delete data._;
        reduxAction(dispatch, {
          type: "SET_DECKS_INDEX",
          arg: data,
        });
      }, 1000);
    });
  }
}
