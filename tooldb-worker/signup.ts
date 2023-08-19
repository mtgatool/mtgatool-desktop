/* eslint-disable no-restricted-globals */
import { DbUserids } from "./dbTypes";
import login from "./login";

function waitMs(ms: number): Promise<true> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), ms);
  });
}

/**
 * Sign up process
 * @param username plaintext username
 * @param password sha1 of the plaintext password
 * @returns Promise<PutMessage>
 */
export default function signup(username: string, password: string) {
  return self.toolDb
    .signUp(username, password)
    .then((msg) => {
      // console.log("Sent signup! now wait");
      return waitMs(3000).then(() => {
        // console.log("wait finished, now login");
        return login(username, password).then((_keys) => {
          // console.log("login ok!?");
          return self.toolDb
            .putData<DbUserids>("userids", {}, true)
            .then((_put) => {
              return msg;
            });
        });
      });
    })
    .catch((err) => {
      self.postMessage({ type: "SIGNUP_ERR", err });
    });
}
