import { DbUserids } from "../types/dbTypes";

export default function signup(username: string, password: string) {
  return window.toolDb.signUp(username, password).then((msg) => {
    return new Promise((resolve) => {
      async function doSign() {
        await window.toolDb.signIn(username, password);
        await window.toolDb.putData<DbUserids>("userids", {}, true);
        await window.toolDb.putData("decksIndex", {}, true);
        await window.toolDb.putData("matchesIndex", [], true);

        resolve(msg);
      }
      doSign();
    });
  });
}
