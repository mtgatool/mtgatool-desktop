import { AllFilters, Filters } from "../../../types/genericFilterTypes";

export default function setFilter<D>(
  filters: Filters<D>,
  newFilter: AllFilters<D>
): Filters<D> {
  const newFilters = [...filters];

  let setToIndex: undefined | number;
  filters.forEach((element, index) => {
    if (element.type === newFilter.type) {
      setToIndex = index;
    }
  });

  if (setToIndex) {
    newFilters[setToIndex] = newFilter;
  } else {
    newFilters.push(newFilter);
  }

  return newFilters;
}
