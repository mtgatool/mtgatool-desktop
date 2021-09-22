import globalData from "../utils/globalData";

export default function getLocalDbValue<T>(
  key: string
): Promise<T | undefined> {
  return new Promise((resolve) => {
    if (!globalData.idb) resolve(undefined);
    else {
      const transaction = globalData.idb.transaction(["tooldb"], "readonly");
      const objectStore = transaction.objectStore("tooldb");
      const dbvalue = objectStore.get(key);
      dbvalue.onsuccess = () => {
        const data = dbvalue.result?.value || undefined;
        resolve(data);
      };

      dbvalue.onerror = () => {
        resolve(undefined);
      };
    }
  });
}
