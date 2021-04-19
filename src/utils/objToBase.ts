export default function objToBase(object: any) {
  const str = JSON.stringify(object);
  return Buffer.from(str).toString("base64");
}
