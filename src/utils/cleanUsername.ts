export default function cleanUsername(str: string): string {
  const emailTest = new RegExp(/(.*)@(.*)/);

  const result = emailTest.exec(str);
  if (result) return result[1];

  return str;
}
