export default function getLocalDbValue<T>(
  key: string
): Promise<T | undefined> {
  return new Promise((resolve) => {
    window.toolDb.store.get(key, (err, data) => {
      if (err) {
        resolve(undefined);
      } else {
        try {
          const json = JSON.parse(data);
          resolve(json.v);
        } catch (_e) {
          resolve(undefined);
        }
      }
    });
  });
}
