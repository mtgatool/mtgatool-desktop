/* eslint-disable no-restricted-globals */

export default function getData(
  msgId: string,
  key: string,
  userNamespaced: boolean,
  timeoutMs = 5000
) {
  return self.toolDb
    .getData(key, userNamespaced, timeoutMs)
    .then((value) => {
      self.postMessage({ type: `${msgId}_OK`, value });
    })
    .catch((err) => {
      self.postMessage({ type: `${msgId}_ERR`, err });
    });
}
