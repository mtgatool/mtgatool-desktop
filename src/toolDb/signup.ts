import { DbUserids } from "../types/dbTypes";
import login from "./login";

/**
 * Sign up process
 * @param username plaintext username
 * @param password sha1 of the plaintext password
 * @returns Promise<PutMessage>
 */
export default function signup(username: string, password: string) {
  return window.toolDb.signUp(username, password).then((msg) => {
    return login(username, password).then((_keys) => {
      return window.toolDb
        .putData<DbUserids>("userids", {}, true)
        .then((_put) => {
          return msg;
        });
    });
  });
}
