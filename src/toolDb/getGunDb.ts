import globalData from "../utils/globalData";

export default function getGunDb(): any {
  // let db = {};
  // try {
  //   db = JSON.parse(localStorage.getItem("gun/") || "{}");
  // } catch (e) {
  //   //
  // }

  const open = indexedDB.open("tooldb", 1);
  open.onsuccess = () => {
    const db = open.result;
    globalData.idb = db;
  };
}
