import afterLogin from "./afterLogin";

export default function login(username: string, password: string) {
  return window.toolDb
    .signIn(username, password)
    .then((keys) => {
      window.toolDb.putData("username", username, true);
      afterLogin();

      window.postMessage({ type: "LOGIN_OK" });

      return keys;
    })
    .catch((err) => {
      window.postMessage({ type: "LOGIN_ERR", err });
    });
}
