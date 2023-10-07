import _ from "lodash";

import { DbUserids } from "../types/dbTypes";
import { getData, putData } from "./worker-wrapper";

export default async function upsertDbUserdata(newData: DbUserids) {
  console.log("> Upsert userdata", newData);

  getData<DbUserids>("userids", true)
    .then((userids) => {
      if (userids) {
        const data = _.omit(
          {
            ...userids,
            ...newData,
          },
          ["", "undefined"]
        );

        putData<DbUserids>("userids", data, true);
      } else {
        putData<DbUserids>("userids", newData, true);
      }
    })
    .catch((_e) => {
      putData<DbUserids>("userids", newData, true);
    });
}
