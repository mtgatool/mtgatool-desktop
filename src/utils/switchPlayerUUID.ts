import getGunUser from "../gun/getGunUser";
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import setLocalSetting from "./setLocalSetting";

export default async function switchPlayerUUID(uuid: string) {
  console.info("switchPlayerUUID", uuid);
  setLocalSetting("playerId", uuid);
  const { dispatch, getState } = store;
  const userRef = getGunUser();

  if (getState().mainData.currentUUID !== uuid && userRef) {
    try {
      userRef.get("uuidData").get(getState().mainData.currentUUID).off();
    } catch (e) {
      console.error(e);
    }

    reduxAction(dispatch, {
      type: "SET_UUID",
      arg: uuid,
    });
  }
}
