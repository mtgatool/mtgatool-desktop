import { isEqual } from "lodash";

export default function countValues<D>(array: D[], value: D): number {
  let count = 0;
  array.forEach((v) => {
    if (isEqual(v, value)) count += 1;
  });
  return count;
}
