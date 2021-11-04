import { DbUserids } from "../types/dbTypes";
import login from "./login";

export default function signup(username: string, password: string) {
  console.log("signup", username, password);
  return window.toolDb.signUp(username, password).then((msg) => {
    console.log("msg", msg);
    return login(username, password).then((keys) => {
      console.log("keys", keys);
      return window.toolDb
        .putData<DbUserids>("userids", {}, true)
        .then((put) => {
          console.log("put", put);
          return msg;
        });
    });
  });
}
