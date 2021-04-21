// eslint-disable-next-line import/no-unresolved
import { IGunChainReference } from "gun/types/chain";
import getGunUser from "../gun/getGunUser";
import globalData from "../utils/globalData";
import reduxAction from "./reduxAction";
import store from "./stores/rendererStore";

function _listenCRDT(
  graphRef: IGunChainReference,
  callback: (arg: any, key: string) => void
) {
  graphRef.on(
    (data: any, k) => {
      // console.log(`Check on: ${k}`);
      const crdt = data._[">"];
      const { CRDTList } = globalData;

      const updatedKeys = Object.keys(crdt).filter(
        (key) => CRDTList[key] == undefined || CRDTList[key] > crdt[key]
      );
      if (updatedKeys.length > 0) {
        console.log(`Filtered keys (${k})`, updatedKeys);
      }
      globalData.CRDTList = { ...globalData.CRDTList, ...crdt };

      updatedKeys.forEach((key) => {
        const getRef = data[key]["#"] as string;
        (window as any).gun.get(getRef).open(
          (dd: any) => {
            // console.info("Open:");
            // console.log(key);
            // console.log(dd);
            callback(dd, key);
          },
          {
            off: true,
          }
        );
      });
    },
    { change: true }
  );
}

function listenFullCRDT(
  graphRef: IGunChainReference,
  callback: (arg: any) => void
) {
  graphRef.open((data: any) => {
    console.log(`listenFullCRDT`, data);
    callback(data);
  });
}

export default function linkGunToRedux() {
  const { dispatch } = store;
  const userRef = getGunUser();
  if (userRef) {
    // Create listeners for Gun's Graph api
    // These will check against the internal Graph data for new data and push directly to redux
    // This is done so we minimioze queries to the graph, so its Superfast!
    listenFullCRDT(userRef.get("matches"), (openData: any) => {
      reduxAction(dispatch, {
        type: "SET_MATCHES",
        arg: openData,
      });
    });

    listenFullCRDT(userRef.get("decks"), (openData: any) => {
      reduxAction(dispatch, {
        type: "SET_DECKS",
        arg: openData,
      });
    });

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
