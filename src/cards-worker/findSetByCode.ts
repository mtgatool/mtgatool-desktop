export default function findSetByCode(code: string, setNames: any, sets: any) {
  const name = setNames[code];
  return name ? sets[name] : undefined;
}
