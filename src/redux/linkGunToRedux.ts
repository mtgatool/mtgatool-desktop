// eslint-disable-next-line import/no-unresolved
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
    userRef.get("decks").on(
      async (data: any) => {
        const object = await getGraphObjectFromPartial<Record<string, GunDeck>>(
          data
        );
        // console.log("on decks", data, object);

        if (object) {
          reduxAction(dispatch, {
            type: "SET_DECKS",
            arg: object,
          });
        }
      },
      {
        change: true,
      }
    );

    userRef.get("matches").on(
      async (data: any) => {
        const object = await getGraphObjectFromPartial<
          Record<string, GunMatch>
        >(data);
        // console.log("on matches", data, object);

        if (object) {
          reduxAction(dispatch, {
            type: "SET_MATCHES",
            arg: object,
          });
        }
      },
      {
        change: true,
      }
    );

    userRef.get("uuidData").on(
      async (data: any) => {
        const object = await getGraphObjectFromPartial<GunUser["uuidData"]>(
          data
        );
        // console.log("on uuid data", data, object);

        if (object) {
          reduxAction(dispatch, {
            type: "SET_ALL_UUID_DATA",
            arg: object,
          });
        }
      },
      {
        change: true,
      }
    );

    userRef.get("decksIndex").on((d: any) => {
      // eslint-disable-next-line no-param-reassign
      const data = { ...d };
      delete data._;
      reduxAction(dispatch, {
        type: "SET_DECKS_INDEX",
        arg: data,
      });
    });
  }
}
