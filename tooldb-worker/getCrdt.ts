/* eslint-disable no-restricted-globals */

export default function getCrdt(
  msgId: string,
  key: string,
  userNamespaced: boolean,
  timeoutMs = 5000
) {
  return self.toolDb
    .getCrdt(key, userNamespaced, timeoutMs)
    .then((value) => {
      self.postMessage({ type: `${msgId}_OK`, value });
    })
    .catch((err) => {
      self.postMessage({ type: `${msgId}_ERR`, err });
    });
}
