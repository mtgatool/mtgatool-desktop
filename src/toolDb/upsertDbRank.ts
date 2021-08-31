import { InternalRank } from "mtgatool-shared";
import { DbUUIDData } from "../types/dbTypes";

export default async function upsertDbRank(rank: InternalRank, uuid: string) {
  console.log("> Upsert rank", rank);

  return window.toolDb
    .getData<DbUUIDData>(`.${uuid}.data`, true)
    .then((uuidData) => {
      const newData = {
        ...uuidData,
        rank: rank,
        updated: new Date().getTime(),
      };

      window.toolDb.putData("uuidData", newData, true);
    });
}
