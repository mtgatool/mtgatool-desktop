import switchPlayerUUID from "../utils/switchPlayerUUID";
import getGunUser from "./getGunUser";

export default async function doWebLogin() {
  const userRef = getGunUser();
  if (userRef) {
    const uuid = await userRef.get("defaultUUID").then();
    switchPlayerUUID(uuid);
    return true;
  }
  return true;
}
