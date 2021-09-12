import { DbUserids } from "../types/dbTypes";

export default async function upsertDbUserids(newData: DbUserids) {
  console.log("> Upsert userdata", newData);

  window.toolDb
    .getData<DbUserids>("userids", true)
    .then((userids) => {
      if (userids) {
        window.toolDb.putData<DbUserids>(
          "userids",
          {
            ...userids,
            ...newData,
          },
          true
        );
      } else {
        window.toolDb.putData<DbUserids>("userids", newData, true);
      }
    })
    .catch((_e) => {
      window.toolDb.putData<DbUserids>("userids", newData, true);
    });
}
