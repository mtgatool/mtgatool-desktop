/* eslint-disable no-restricted-globals */
import { BaseCrdt } from "tool-db";

export default function getCrdt<T>(
  msgId: string,
  key: string,
  crdt: BaseCrdt<T, any, any>,
  userNamespaced: boolean,
  timeoutMs = 5000
) {
  return self.toolDb
    .getCrdt(key, crdt, userNamespaced, timeoutMs)
    .then((value) => {
      self.postMessage({ type: `${msgId}_OK`, value });
    })
    .catch((err) => {
      self.postMessage({ type: `${msgId}_ERR`, err });
    });
}
