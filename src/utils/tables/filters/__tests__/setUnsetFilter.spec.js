import setFilter from "../setFilter";
import unsetFilter from "../unsetFilter";

const someFilters = [
  {
    type: "string",
    id: "somekey",
    value: {
      string: "a string filter",
      not: false,
    },
  },
  {
    type: "colors",
    id: "colorkey",
    value: {
      color: 10,
      not: false,
      mode: "subset",
    },
  },
];

const boolFilter = {
  type: "inbool",
  id: "somotherkey",
  value: {
    not: false,
    mode: "",
    type: "type",
    value: true,
  },
};

const boolModifiedFilter = {
  type: "inbool",
  id: "somotherkey",
  value: {
    not: false,
    mode: "",
    type: "type",
    value: false,
  },
};

// Some of these tests make sure the function can handle an index of zero in the array!
it("Can add a filter", () => {
  expect(setFilter(someFilters, boolFilter)).toStrictEqual([
    ...someFilters,
    boolFilter,
  ]);
});

it("Can add an existing filter", () => {
  expect(
    setFilter([boolFilter, ...someFilters], boolModifiedFilter)
  ).toStrictEqual([boolModifiedFilter, ...someFilters]);
});

it("Can remove a filter", () => {
  expect(unsetFilter([boolFilter, ...someFilters], "inbool")).toStrictEqual(
    someFilters
  );
});

it("Can handle unexistant filter to remove", () => {
  expect(unsetFilter([boolFilter, ...someFilters], "sets")).toStrictEqual([
    boolFilter,
    ...someFilters,
  ]);
});
