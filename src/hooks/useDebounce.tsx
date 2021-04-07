import { useCallback, useRef } from "react";

/**
 * Debouces a function passed to the "deboucer"
 * @param time Time to execute/wait
 */
export default function useDebounce(time: number): (fn: () => void) => void {
  const updateTimeout = useRef<NodeJS.Timeout | null>(null);

  const debouncer = useCallback(
    (fn: () => void) => {
      if (updateTimeout.current) clearTimeout(updateTimeout.current);
      updateTimeout.current = setTimeout(fn, time);
    },
    [time]
  );

  return debouncer;
}
