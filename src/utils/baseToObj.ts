export default function baseToObj<T>(data: string): T {
  if (!data) return {} as any;
  const buff = Buffer.from(data, "base64");
  const str = buff.toString("utf8");
  let obj;
  try {
    obj = JSON.parse(str);
  } catch (e) {
    try {
      obj = JSON.parse(data);
    } catch (ee) {
      console.error(e);
    }
  }
  return obj;
}
