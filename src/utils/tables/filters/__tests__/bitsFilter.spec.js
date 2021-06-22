import bitsFilterFn from "../bitsFilterFn";

// Simulate and example with all 5 colors, one bit for each color
const manyBits = [
  { v: 1 },
  { v: 2 },
  { v: 3 },
  { v: 4 },
  { v: 5 },
  { v: 6 },
  { v: 7 },
  { v: 8 },
  { v: 9 },
  { v: 10 },
  { v: 11 },
  { v: 12 },
  { v: 13 },
  { v: 14 },
  { v: 15 },
  { v: 16 },
  { v: 17 },
  { v: 18 },
  { v: 19 },
  { v: 20 },
  { v: 21 },
  { v: 22 },
  { v: 23 },
  { v: 24 },
  { v: 25 },
  { v: 26 },
  { v: 27 },
  { v: 28 },
  { v: 29 },
  { v: 30 },
  { v: 31 },
];

it("filters bits", () => {
  // AND BR
  expect(
    bitsFilterFn(
      manyBits,
      {
        bits: 12,
        not: false,
        mode: "and",
      },
      "v"
    )
  ).toStrictEqual([
    { v: 4 },
    { v: 5 },
    { v: 6 },
    { v: 7 },
    { v: 8 },
    { v: 9 },
    { v: 10 },
    { v: 11 },
    { v: 12 },
    { v: 13 },
    { v: 14 },
    { v: 15 },
    { v: 20 },
    { v: 21 },
    { v: 22 },
    { v: 23 },
    { v: 24 },
    { v: 25 },
    { v: 26 },
    { v: 27 },
    { v: 28 },
    { v: 29 },
    { v: 30 },
    { v: 31 },
  ]);

  // < BR
  expect(
    bitsFilterFn(
      manyBits,
      {
        bits: 12,
        not: false,
        mode: "strictSubset",
      },
      "v"
    )
  ).toStrictEqual([{ v: 4 }, { v: 8 }]);

  // >= UBR
  expect(
    bitsFilterFn(
      manyBits,
      {
        bits: 14,
        not: false,
        mode: "superset",
      },
      "v"
    )
  ).toStrictEqual([{ v: 14 }, { v: 15 }, { v: 30 }, { v: 31 }]);

  // > UBR
  expect(
    bitsFilterFn(
      manyBits,
      {
        bits: 14,
        not: false,
        mode: "strictSuperset",
      },
      "v"
    )
  ).toStrictEqual([{ v: 15 }, { v: 30 }, { v: 31 }]);

  // <= UBR
  expect(
    bitsFilterFn(
      manyBits,
      {
        bits: 14,
        not: false,
        mode: "subset",
      },
      "v"
    )
  ).toStrictEqual([
    { v: 2 },
    { v: 4 },
    { v: 6 },
    { v: 8 },
    { v: 10 },
    { v: 12 },
    { v: 14 },
  ]);

  // < UBR
  expect(
    bitsFilterFn(
      manyBits,
      {
        bits: 14,
        not: false,
        mode: "strictSubset",
      },
      "v"
    )
  ).toStrictEqual([
    { v: 2 },
    { v: 4 },
    { v: 6 },
    { v: 8 },
    { v: 10 },
    { v: 12 },
  ]);

  // < WUBRG
  expect(
    bitsFilterFn(
      manyBits,
      {
        bits: 31,
        not: false,
        mode: "subset",
      },
      "v"
    )
  ).toStrictEqual(manyBits);

  // !(< WUBRG)
  expect(
    bitsFilterFn(
      manyBits,
      {
        bits: 31,
        not: true,
        mode: "subset",
      },
      "v"
    )
  ).toStrictEqual([]);
});
