/* eslint-disable no-restricted-globals */

export default function addKeyListener(msgId: string, key: string) {
  const id = self.toolDb.addKeyListener(key, (value) => {
    self.postMessage({ type: `LISTENER_${key}`, value });
  });
  self.postMessage({ type: `${msgId}_ID`, id });
}
