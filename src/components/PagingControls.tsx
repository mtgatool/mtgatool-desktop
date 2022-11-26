import InputContainer from "./InputContainer";
import PagingButton from "./PagingButton";
import Select from "./ui/Select";

export interface PagingControlsProps {
  canPreviousPage: boolean;
  canNextPage: boolean;
  pageOptions: number[];
  pageCount: number;
  gotoPage: (updater: ((pageIndex: number) => number) | number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (pageSize: number) => void;
  pageIndex: number;
  pageLabel?: string;
  pageSize: number;
  pageSizeOptions?: number[];
  align?: string;
}

export default function PagingControls({
  canPreviousPage,
  canNextPage,
  pageOptions,
  pageCount,
  gotoPage,
  nextPage,
  previousPage,
  setPageSize,
  pageLabel,
  pageIndex,
  pageSize,
  pageSizeOptions,
  align,
}: PagingControlsProps): JSX.Element {
  const _pageSizeOptions = pageSizeOptions ?? [10, 25, 50, 100];
  const expandButtons = pageCount < 10;

  let pageButtons: JSX.Element[] | JSX.Element = [];
  if (expandButtons) {
    for (let n = 0; n < pageCount; n += 1) {
      pageButtons.push(
        <PagingButton
          key={n}
          onClick={(): void => gotoPage(n)}
          disabled={pageIndex === n}
          selected={pageIndex === n}
        >
          {n + 1}
        </PagingButton>
      );
    }
  } else {
    const prompt = "Go to page";
    pageButtons = (
      <>
        <span className="paging-text">Page</span>
        <InputContainer
          title={prompt}
          style={{ width: "50px", margin: "0 4px" }}
        >
          <input
            type="number"
            defaultValue=""
            onBlur={(e): void => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(page);
              e.target.value = "";
            }}
            onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>): void => {
              if (e.keyCode === 13) {
                (e.target as HTMLInputElement).blur();
                e.stopPropagation();
              }
            }}
            style={{ width: "40px" }}
            placeholder={String(pageIndex + 1)}
          />
        </InputContainer>
        <span className="paging-text">
          <strong>of {pageOptions?.length}</strong>{" "}
        </span>
      </>
    );
  }

  return (
    <div
      className="paging-container"
      style={{ justifyContent: align || "center" }}
    >
      {!expandButtons && (
        <PagingButton
          onClick={(): void => gotoPage(0)}
          disabled={!canPreviousPage}
          selected={!canPreviousPage}
        >
          {"<<"}
        </PagingButton>
      )}
      <PagingButton
        onClick={(): void => previousPage()}
        disabled={!canPreviousPage}
      >
        {"<"}
      </PagingButton>
      {pageButtons}
      <PagingButton onClick={(): void => nextPage()} disabled={!canNextPage}>
        {">"}
      </PagingButton>
      {!expandButtons && (
        <PagingButton
          style={{ minWidth: "30px" }}
          onClick={(): void => gotoPage(pageCount - 1)}
          disabled={!canNextPage}
          selected={!canNextPage}
        >
          {">>"}
        </PagingButton>
      )}
      <Select
        current={pageSize}
        options={_pageSizeOptions}
        optionFormatter={(_pageSize): string =>
          `Show ${_pageSize}${pageLabel ? ` ${pageLabel}` : ""}`
        }
        callback={(val): void => setPageSize(val)}
        style={{ width: "140px" }}
      />
    </div>
  );
}
