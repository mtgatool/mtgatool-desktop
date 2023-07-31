import { ParsedKeys } from "mtgatool-db";

const login = (username: string, password: string) => {
  return new Promise((resolve, reject) => {
    if (window.toolDbWorker) {
      window.toolDbWorker.postMessage({
        type: "LOGIN",
        username,
        password,
      });

      const listener = (e: any) => {
        const { type } = e.data;

        if (type === "LOGIN_OK") {
          resolve(true);
          window.toolDbWorker.removeEventListener("message", listener);
        }
        if (type === "LOGIN_ERR") {
          reject(e.data.err);
          window.toolDbWorker.removeEventListener("message", listener);
        }
        window.toolDbWorker.removeEventListener("message", listener);
      };
      window.toolDbWorker.onmessage = listener;
    } else {
      reject(new Error("toolDbWorker not available"));
    }
  });
};

const keysLogin = (username: string, keys: ParsedKeys) => {
  return new Promise((resolve, reject) => {
    if (window.toolDbWorker) {
      window.toolDbWorker.postMessage({
        type: "KEYS_LOGIN",
        username,
        keys,
      });

      const listener = (e: any) => {
        const { type } = e.data;

        if (type === "LOGIN_OK") {
          resolve(true);
          window.toolDbWorker.removeEventListener("message", listener);
        }
        if (type === "LOGIN_ERR") {
          reject(e.data.err);
          window.toolDbWorker.removeEventListener("message", listener);
        }
      };
      window.toolDbWorker.onmessage = listener;
    } else {
      reject(new Error("toolDbWorker not available"));
    }
  });
};

const signup = (username: string, password: string) => {
  return new Promise((resolve, reject) => {
    if (window.toolDbWorker) {
      window.toolDbWorker.postMessage({
        type: "SIGNUP",
        username,
        password,
      });

      const listener = (e: any) => {
        const { type } = e.data;

        if (type === "LOGIN_OK") {
          resolve(true);
          window.toolDbWorker.removeEventListener("message", listener);
        }
        if (type === "LOGIN_ERR" || type === "SIGNUP_ERR") {
          reject(e.data.err);
          window.toolDbWorker.removeEventListener("message", listener);
        }
      };
      window.toolDbWorker.onmessage = listener;
    } else {
      reject(new Error("toolDbWorker not available"));
    }
  });
};

export { keysLogin, login, signup };
