/* eslint-disable radix */
import { create, all, MathJsStatic } from "mathjs";

const config = { precision: 2000 };
const math: MathJsStatic = create(all, config) as MathJsStatic;

export default function parseLogTimestamp(numb: string | number): Date {
  const normalEpoch: any = math.divide(
    math.subtract(
      math.bignumber(parseInt(`${numb}`)),
      math.bignumber(621355968000000000)
    ),
    math.bignumber(10 * 1000)
  );

  const date = new Date(math.floor(math.number(normalEpoch) as any));
  return date;
}
