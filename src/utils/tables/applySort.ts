import _ from "lodash";

import { Sort } from "../../components/SortControls";

export default function applySort<D>(data: D[], sort: Sort<D>): D[] {
  const sortKey = sort.key as keyof D;
  let newData = data;
  if (sort && sort.key !== "" && data[0] && data[0][sortKey]) {
    newData = _.orderBy(data, [sortKey], [sort.sort === 1 ? "asc" : "desc"]);
  }
  return newData;
}
