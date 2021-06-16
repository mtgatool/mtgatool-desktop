import { Filters, filterType } from "../../../types/genericFilterTypes";

export default function unsetFilter<D>(
  filters: Filters<D>,
  type: filterType
): Filters<D> {
  let sliceIndex: number | undefined;
  filters.forEach((element, index) => {
    if (element.type === type) {
      sliceIndex = index;
    }
  });

  if (sliceIndex) {
    return filters.splice(sliceIndex, 1);
  }

  return filters;
}
