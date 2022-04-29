import inStringArrayFilterFn from "../inStringArrayFilterFn";

// Simulate and example with all 5 colors, one bit for each color
const manyCards = [
  { id: 0, banned: ["Standard"], legal: ["Historic", "TraditionalHistoric"] },
  { id: 1, banned: [], legal: ["Standard", "Historic"] },
  { id: 2, banned: ["Standard", "Historic"], legal: [] },
  { id: 3, banned: [], legal: ["Standard", "", "asdasj"] },
  { id: 4, banned: [], legal: ["Standard", "Singleton"] },
  { id: 5, banned: [""], legal: ["Standard", "Historic", "RetroHistoric"] },
];

it("filters sets", () => {
  expect(
    inStringArrayFilterFn(
      manyCards,
      {
        string: "historic",
        not: false,
      },
      "legal"
    ).map((c) => c.id)
  ).toStrictEqual([0, 1, 5]);

  expect(
    inStringArrayFilterFn(
      manyCards,
      {
        string: "historic",
        not: true,
      },
      "legal"
    ).map((c) => c.id)
  ).toStrictEqual([2, 3, 4]);

  expect(
    inStringArrayFilterFn(
      manyCards,
      {
        string: "Standard",
        not: false,
      },
      "banned"
    ).map((c) => c.id)
  ).toStrictEqual([0, 2]);

  // Pass trough the filter if format does not exist
  expect(
    inStringArrayFilterFn(
      manyCards,
      {
        string: "asdasj",
        not: false,
      },
      "legal"
    ).map((c) => c.id)
  ).toStrictEqual([0, 1, 2, 3, 4, 5]);
});
