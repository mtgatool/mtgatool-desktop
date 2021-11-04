/* eslint-disable */
// @ts-nocheck

export default function setupIdb() {
  const dbName = "tooldb";
  let db = null;
  const store = {};
  store.start = function () {
    // console.warn("store start");
    const open = indexedDB.open(dbName, 1);
    open.onupgradeneeded = function (eve) {
      eve.target.result.createObjectStore(dbName);
    };
    open.onsuccess = function () {
      db = open.result;
    };
    open.onerror = function (eve) {
      console.warn(eve || 1);
    };
  };
  store.start();
  store.put = function (key, data, cb) {
    // console.warn("store put", key);
    if (!db) {
      setTimeout(function () {
        store.put(key, data, cb);
      }, 1);
      return;
    }
    const tx = db.transaction([dbName], "readwrite");
    const obj = tx.objectStore(dbName);
    const req = obj.put(data, `${key}`);
    if (cb) {
      req.onsuccess =
        obj.onsuccess =
        tx.onsuccess =
          function () {
            cb(null, 1);
          };
      req.onabort =
        obj.onabort =
        tx.onabort =
          function (eve) {
            cb(eve || "put.tx.abort");
          };
      req.onerror =
        obj.onerror =
        tx.onerror =
          function (eve) {
            cb(eve || "put.tx.error");
          };
    }
  };
  store.get = function (key, cb) {
    // console.warn("store get", key);
    if (!db) {
      setTimeout(function () {
        store.get(key, cb);
      }, 9);
      return;
    }
    const tx = db.transaction([dbName], "readonly");
    const obj = tx.objectStore(dbName);
    const req = obj.get(`${key}`);
    req.onsuccess = function () {
      cb(null, req.result);
    };
    req.onabort = function (eve) {
      cb(eve || 4);
    };
    req.onerror = function (eve) {
      cb(eve || 5);
    };
  };
  setInterval(function () {
    db && db.close();
    db = null;
    store.start();
  }, 1000 * 15); // reset webkit bug?
  return store;
}
