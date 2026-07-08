import { useEffect, useState } from "react";

import {
  clearDebug,
  DebugEntry,
  getDebug,
  subscribeDebug,
} from "../utils/debugLog";

/**
 * Toggleable on-screen debug overlay. Shows the recent pipeline events pushed
 * via pushDebug (channel messages reaching the UI, memory reads, log watcher).
 * Toggle with the button or Ctrl+Shift+D.
 */
export default function DebugPanel(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);

  useEffect(() => subscribeDebug(() => force((n) => n + 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const entries: DebugEntry[] = getDebug();

  const fmt = (t: number) => {
    const d = new Date(t);
    return `${d.toLocaleTimeString()}.${String(d.getMilliseconds()).padStart(
      3,
      "0"
    )}`;
  };

  return (
    <>
      <div
        onClick={() => setOpen((o) => !o)}
        title="Toggle debug panel (Ctrl+Shift+D)"
        style={{
          position: "fixed",
          bottom: 6,
          right: 8,
          zIndex: 9998,
          fontSize: 11,
          padding: "2px 8px",
          borderRadius: 4,
          cursor: "pointer",
          background: "var(--color-section, #222)",
          color: "var(--color-text, #aaa)",
          opacity: 0.7,
          userSelect: "none",
        }}
      >
        {`debug (${entries.length})`}
      </div>

      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            right: 8,
            width: 560,
            maxWidth: "calc(100vw - 16px)",
            height: 320,
            zIndex: 9999,
            background: "rgba(10,10,14,0.95)",
            color: "#cdd",
            border: "1px solid #333",
            borderRadius: 6,
            display: "flex",
            flexDirection: "column",
            fontFamily: "monospace",
            fontSize: 11,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 8px",
              borderBottom: "1px solid #333",
            }}
          >
            <span>Debug events ({entries.length})</span>
            <span>
              <button
                type="button"
                onClick={() => clearDebug()}
                style={{ marginRight: 8, cursor: "pointer" }}
              >
                clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ cursor: "pointer" }}
              >
                close
              </button>
            </span>
          </div>
          <div style={{ overflow: "auto", padding: "4px 8px", flex: 1 }}>
            {entries.length === 0 ? (
              <div style={{ opacity: 0.6 }}>
                No events yet. Waiting for the pipeline…
              </div>
            ) : (
              entries
                .slice()
                .reverse()
                .map((e, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <div key={i} style={{ whiteSpace: "pre-wrap" }}>
                    <span style={{ opacity: 0.5 }}>{fmt(e.time)}</span> {e.msg}
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
