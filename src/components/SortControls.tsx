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
  /**
   * How the controls look.
   *
   * `columns` is the original: the options laid out as a table header. It suits
   * the decks and history lists, which really are tables and whose columns line
   * up underneath.
   *
   * `chips` is for grids. Above a wall of card images the same header reads as
   * five mislabelled columns rather than five controls — nothing about it says
   * it can be pressed, and the arrow marking the active one is positioned off
   * to the right of the label it belongs to.
   */
  variant?: "columns" | "chips";
}

export default function SortControls<T>(props: SortControlsProps<T>) {
  const {
    columnKeys,
    className,
    columnNames,
    defaultSort,
    setSortCallback,
    variant = "columns",
  } = props;

  const [currentSort, setCurrentSort] = useState<Sort<T>>(
    defaultSort || ({ key: "", sort: 1 } as Sort<T>)
  );

  const apply = (sort: Sort<T>): void => {
    setSortCallback(sort);
    setCurrentSort(sort);
  };

  if (variant === "chips") {
    return (
      <div className={`sort-chips ${className || ""}`}>
        <div className="sort-chips-label">Sort</div>
        {columnKeys.map((key: keyof T, index) => {
          const active = key === currentSort.key;
          const ascending = currentSort.sort === 1;
          return (
            <button
              type="button"
              key={`sort-chip-${String(key)}`}
              className={`sort-chip ${active ? "active" : ""}`}
              title={
                active
                  ? `Sorted ${
                      ascending ? "ascending" : "descending"
                    } — click to reverse`
                  : `Sort by ${
                      (columnNames && columnNames[index]) || String(key)
                    }`
              }
              onClick={(): void =>
                // Pressing the active one reverses it; pressing another starts
                // it descending, as the table header always has. There is no
                // third press that clears the sort — nothing showed that state
                // existed, and the list has to be in some order regardless.
                apply({ key, sort: active && !ascending ? 1 : -1 })
              }
            >
              {(columnNames && columnNames[index]) || String(key)}
              {active ? (
                <span
                  className={`sort-chip-arrow ${ascending ? "asc" : "desc"}`}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`table-head ${className || ""}`}>
      {columnKeys.map((key: keyof T, index) => {
        return (
          <div
            className={`table-head-container control-${String(key)}`}
            key={`table-head-${String(key)}`}
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
              apply(sort);
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
