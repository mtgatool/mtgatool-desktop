import { DbUserids } from "../types/dbTypes";
import { getData, putData } from "./worker-wrapper";

export default async function upsertDbUserids(newData: DbUserids) {
  console.log("> Upsert userdata", newData);

  getData<DbUserids>("userids", true)
    .then((userids) => {
      if (userids) {
        putData<DbUserids>(
          "userids",
          {
            ...userids,
            ...newData,
          },
          true
        );
      } else {
        putData<DbUserids>("userids", newData, true);
      }
    })
    .catch((_e) => {
      putData<DbUserids>("userids", newData, true);
    });
}
