/* eslint-disable no-restricted-globals */

export default function getDataLocal(msgId: string, key: string) {
  return new Promise((resolve) => {
    self.toolDb.store.get(key, (err, data) => {
      if (err) {
        self.postMessage({ type: `${msgId}_ERR` });
      } else if (data) {
        try {
          const json = JSON.parse(data);

          self.postMessage({ type: `${msgId}_OK`, value: json.v });

          resolve(json.v);
        } catch (_e) {
          self.postMessage({ type: `${msgId}_ERR` });
        }
      } else {
        self.postMessage({ type: `${msgId}_ERR` });
      }
    });
  });
}
