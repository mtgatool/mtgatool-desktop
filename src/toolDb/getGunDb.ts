export default function getGunDb(): any {
  let db = {};
  try {
    db = JSON.parse(localStorage.getItem("gun/") || "{}");
  } catch (e) {
    //
  }

  return db;
}
