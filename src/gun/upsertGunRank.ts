import { InternalRank } from "mtgatool-shared";
import getGunUser from "./getGunUser";
import gunRefExists from "./gunRefExists";

export default async function upsertGunRank(rank: InternalRank, uuid: string) {
  const userRef = getGunUser();

  console.log("> Upsert rank", rank);

  if (userRef) {
    userRef
      .get("uuidData")
      .get(uuid || "default")
      .get("rank")
      .put(rank);

    const defaultUUIDExists = await gunRefExists(userRef.get("defaultUUID"));
    if (!defaultUUIDExists) {
      userRef.get("defaultUUID").put(uuid);
    }
  }
  return true;
}
