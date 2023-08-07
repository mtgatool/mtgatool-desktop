/* eslint-disable no-restricted-globals */

export default function doFunction(
  msgId: string,
  fname: string,
  args: boolean
) {
  return self.toolDb
    .doFunction(fname, args)
    .then((value) => {
      self.postMessage({ type: `${msgId}_OK`, value });
    })
    .catch((err) => {
      self.postMessage({ type: "LOGIN_ERR", err });
    });
}
