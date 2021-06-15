import { useCallback, useMemo, useState } from "react";

interface PagingControls {
  canPreviousPage: boolean;
  canNextPage: boolean;
  pageOptions: number[];
  pageCount: number;
  gotoPage: (updater: ((pageIndex: number) => number) | number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (pageSize: number) => void;
  pageIndex: number;
  pageSize: number;
}

export default function usePagingControls(
  dataSize: number,
  defaultPageSize = 10
): PagingControls {
  const [pageIndex, gotoPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const pageCount = useMemo(() => Math.ceil(dataSize / pageSize), [
    dataSize,
    pageSize,
  ]);

  const canPreviousPage = useMemo(() => pageIndex > 0, [pageIndex]);
  const canNextPage = useMemo(() => pageIndex < pageCount - 1, [
    pageIndex,
    pageCount,
  ]);

  const pageOptions = useMemo(
    () => new Array(pageCount).fill(0).map((v, i) => i),
    [pageCount]
  );

  const nextPage = useCallback(
    () => (canNextPage ? gotoPage(pageIndex + 1) : undefined),
    [canNextPage, pageIndex]
  );

  const previousPage = useCallback(
    () => (canPreviousPage ? gotoPage(pageIndex - 1) : undefined),
    [canPreviousPage, pageIndex]
  );

  return {
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    pageIndex,
    pageSize,
  };
}
