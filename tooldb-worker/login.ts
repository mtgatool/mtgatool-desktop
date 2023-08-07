/* eslint-disable no-restricted-globals */
import afterLogin from "./afterLogin";
import reduxAction from "./reduxAction";

export default function login(username: string, password: string) {
  return self.toolDb
    .signIn(username, password)
    .then((keys) => {
      self.toolDb.putData("username", username, true);
      afterLogin();

      self.postMessage({ type: "LOGIN_OK" });

      reduxAction("SET_PUBKEY", self.toolDb.user?.pubKey);

      return keys;
    })
    .catch((err) => {
      self.postMessage({ type: "LOGIN_ERR", err });
    });
}
