/* eslint-disable no-restricted-globals */

export default function getDataLocal(msgId: string, key: string) {
  return self.toolDb.store
    .get(key)
    .then((data) => {
      if (data) {
        try {
          const json = JSON.parse(data);
          self.postMessage({ type: `${msgId}_OK`, value: json.v });
          return json.v;
        } catch (_e) {
          self.postMessage({ type: `${msgId}_ERR`, err: _e });
          return undefined;
        }
      } else {
        self.postMessage({ type: `${msgId}_ERR`, err: "No data" });
        return undefined;
      }
    })
    .catch((err) => {
      self.postMessage({ type: `${msgId}_ERR`, err });
      return undefined;
    });
}
