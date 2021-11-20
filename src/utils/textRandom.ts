export default function textRandom(_l = 24, _c?: string): string {
  let l = _l;
  let s = "";
  const c =
    _c || "0123456789ABCDEFGHIJKLMNOPQRSTUVWXZabcdefghijklmnopqrstuvwxyz";
  while (l > 0) {
    s += c.charAt(Math.floor(Math.random() * c.length));
    l -= 1;
  }
  return s;
}
