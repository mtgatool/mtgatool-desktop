import { FunctionReturn, ParsedKeys } from "mtgatool-db";

import { MatchData } from "../components/views/history/convertDbMatchData";

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
      };
      window.toolDbWorker.addEventListener("message", listener);
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
      window.toolDbWorker.addEventListener("message", listener);
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
      window.toolDbWorker.addEventListener("message", listener);
    } else {
      reject(new Error("toolDbWorker not available"));
    }
  });
};

const putData = <T = any>(key: string, data: T, userNamespaced = false) => {
  return new Promise((resolve, reject) => {
    if (window.toolDbWorker) {
      window.toolDbWorker.postMessage({
        type: "PUT_DATA",
        key,
        data,
        userNamespaced,
      });

      resolve(true);
    } else {
      reject(new Error("toolDbWorker not available"));
    }
  });
};

const getData = <T = any>(
  key: string,
  userNamespaced = false,
  timeoutMs = 5000
): Promise<T | null> => {
  return new Promise((resolve, reject) => {
    if (window.toolDbWorker) {
      const id = Math.random().toString(36).substring(7);
      window.toolDbWorker.postMessage({
        type: "GET_DATA",
        key,
        userNamespaced,
        timeoutMs,
        id,
      });

      const listener = (e: any) => {
        const { type, value } = e.data;

        if (type === `${id}_OK`) {
          resolve(value);
          window.toolDbWorker.removeEventListener("message", listener);
        }
        if (type === `${id}_ERR`) {
          reject(e.data.err);
          window.toolDbWorker.removeEventListener("message", listener);
        }
      };
      window.toolDbWorker.addEventListener("message", listener);
    } else {
      reject(new Error("toolDbWorker not available"));
    }
  });
};

const doFunction = <T = any>(
  fname: string,
  args = {},
  timeoutMs = 5000
): Promise<FunctionReturn<T | null>> => {
  return new Promise((resolve, reject) => {
    if (window.toolDbWorker) {
      const id = Math.random().toString(36).substring(7);
      window.toolDbWorker.postMessage({
        type: "DO_FUNCTION",
        fname,
        args,
        id,
        timeoutMs,
      });

      const listener = (e: any) => {
        const { type, value } = e.data;

        if (type === `${id}_OK`) {
          resolve(value);
          window.toolDbWorker.removeEventListener("message", listener);
        }
        if (type === `${id}_ERR`) {
          reject(e.data.err);
          window.toolDbWorker.removeEventListener("message", listener);
        }
      };
      window.toolDbWorker.addEventListener("message", listener);
    } else {
      reject(new Error("toolDbWorker not available"));
    }
  });
};

const getLocalData = <T = any>(
  key: string,
  userNamespaced = false
): Promise<T | null> => {
  return new Promise((resolve, reject) => {
    if (window.toolDbWorker) {
      const id = Math.random().toString(36).substring(7);
      window.toolDbWorker.postMessage({
        type: "GET_LOCAL_DATA",
        key,
        userNamespaced,
        id,
      });

      const listener = (e: any) => {
        const { type, value } = e.data;

        if (type === `${id}_OK`) {
          resolve(value);
          window.toolDbWorker.removeEventListener("message", listener);
        }
        if (type === `${id}_ERR`) {
          reject(e.data.err);
          window.toolDbWorker.removeEventListener("message", listener);
        }
      };
      window.toolDbWorker.addEventListener("message", listener);
    } else {
      reject(new Error("toolDbWorker not available"));
    }
  });
};

const queryKeys = (
  key: string,
  userNamespaced = false,
  timeoutMs = 5000
): Promise<string[] | null> => {
  return new Promise((resolve, reject) => {
    if (window.toolDbWorker) {
      const id = Math.random().toString(36).substring(7);
      window.toolDbWorker.postMessage({
        type: "QUERY_KEYS",
        key,
        userNamespaced,
        timeoutMs,
        id,
      });

      const listener = (e: any) => {
        const { type, value } = e.data;

        if (type === `${id}_OK`) {
          resolve(value);
          window.toolDbWorker.removeEventListener("message", listener);
        }
        if (type === `${id}_ERR`) {
          reject(e.data.err);
          window.toolDbWorker.removeEventListener("message", listener);
        }
      };
      window.toolDbWorker.addEventListener("message", listener);
    } else {
      reject(new Error("toolDbWorker not available"));
    }
  });
};

const subscribeData = (key: string, userNamespaced = false): Promise<null> => {
  return new Promise((resolve, reject) => {
    if (window.toolDbWorker) {
      const id = Math.random().toString(36).substring(7);
      window.toolDbWorker.postMessage({
        type: "SUBSCRIBE",
        id,
        key,
        userNamespaced,
      });
    } else {
      reject(new Error("toolDbWorker not available"));
    }
  });
};

const removeKeyListener = (listenerId: number): Promise<null> => {
  return new Promise((resolve, reject) => {
    if (window.toolDbWorker) {
      window.toolDbWorker.postMessage({
        type: "REMOVE_KEY_LISTENER",
        id: listenerId,
      });
    } else {
      reject(new Error("toolDbWorker not available"));
    }
  });
};

const addKeyListener = (key: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (window.toolDbWorker) {
      const id = Math.random().toString(36).substring(7);
      window.toolDbWorker.postMessage({
        type: "ADD_KEY_LISTENER",
        key,
        id,
      });

      const listener = (e: any) => {
        const { type, id: listenerId } = e.data;

        if (type === `${id}_ID`) {
          resolve(listenerId);
          window.toolDbWorker.removeEventListener("message", listener);
        }
        if (type === `${id}_ERR`) {
          reject(e.data.err);
          window.toolDbWorker.removeEventListener("message", listener);
        }
      };
      window.toolDbWorker.addEventListener("message", listener);
    } else {
      reject(new Error("toolDbWorker not available"));
    }
  });
};

const getMatchesData = (
  matchesIndex: string[],
  uuid?: string
): Promise<MatchData[] | null> => {
  return new Promise((resolve, reject) => {
    if (window.toolDbWorker) {
      const id = Math.random().toString(36).substring(7);
      window.toolDbWorker.postMessage({
        type: "GET_MATCHES_DATA",
        matchesIndex,
        uuid,
        id,
      });

      const listener = (e: any) => {
        const { type, value } = e.data;

        if (type === `${id}_OK`) {
          resolve(value);
          window.toolDbWorker.removeEventListener("message", listener);
        }
        if (type === `${id}_ERR`) {
          reject(e.data.err);
          window.toolDbWorker.removeEventListener("message", listener);
        }
      };
      window.toolDbWorker.addEventListener("message", listener);
    } else {
      reject(new Error("toolDbWorker not available"));
    }
  });
};

window.toolDb = {
  doFunction,
  getData,
  getLocalData,
  getMatchesData,
  putData,
  queryKeys,
  addKeyListener,
  removeKeyListener,
  subscribeData,
} as any;

export {
  addKeyListener,
  doFunction,
  getData,
  getLocalData,
  getMatchesData,
  keysLogin,
  login,
  putData,
  queryKeys,
  removeKeyListener,
  signup,
  subscribeData,
};
