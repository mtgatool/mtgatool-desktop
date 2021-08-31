import { useState } from "react";

export interface Sort<T> {
  // eslint-disable-next-line prettier/prettier
  key: keyof T | "";
  sort: number;
}

interface SortControlsProps<T> {
  columnKeys: (keyof T)[];
  className?: string;
  columnNames?: string[];
  defaultSort?: Sort<T>;
  setSortCallback: (sort: Sort<T>) => void;
}

export default function SortControls<T>(props: SortControlsProps<T>) {
  const { columnKeys, className, columnNames, defaultSort, setSortCallback } =
    props;

  const [currentSort, setCurrentSort] = useState<Sort<T>>(
    defaultSort || ({ key: "", sort: 1 } as Sort<T>)
  );

  return (
    <div className={`table-head ${className || ""}`}>
      {columnKeys.map((key: keyof T, index) => {
        return (
          <div
            className="table-head-container"
            key={`table-head-${key}`}
            style={{
              gridArea: `1 / ${index + 1} / 1 / ${index + 2}`,
              cursor: "pointer",
            }}
            onClick={() => {
              const sort: Sort<T> = { key, sort: -1 };
              if (key == currentSort.key) {
                if (currentSort.sort === -1) {
                  sort.sort = 1;
                } else {
                  sort.key = "";
                }
              }
              setSortCallback(sort);
              setCurrentSort(sort);
            }}
          >
            <div className="text">
              {(columnNames && columnNames[index]) || key}
            </div>
            {key == currentSort.key && (
              <div
                className={currentSort.sort === 1 ? "sort-asc" : "sort-desc"}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
