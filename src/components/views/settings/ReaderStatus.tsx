import { useEffect, useState } from "react";

import readPlayerTest from "../../../reader/readPlayerTest";

function findMTGA(): Promise<boolean> {
  // eslint-disable-next-line no-undef
  const reader = __non_webpack_require__("mtga-reader");
  // mtga-reader 0.1.7: findProcess is async (threadpool) and resolves to a
  // boolean "is it running".
  const { findProcess } = reader;
  return findProcess("MTGA");
}

function checkAdmin(): boolean {
  // eslint-disable-next-line no-undef
  const reader = __non_webpack_require__("mtga-reader");
  const { isAdmin } = reader;
  // On macOS this reports whether memory is actually readable (the app is
  // signed with the debugger entitlement), not whether we are root.
  return isAdmin();
}

const IS_MAC = process.platform === "darwin";

// macOS grants memory access through a code-signing entitlement, not
// elevation — but a downloaded .app stays quarantined, and a quarantined
// ad-hoc-signed app is killed before the entitlement ever applies.
const NO_ACCESS_TEXT = IS_MAC
  ? "Can't read MTGA memory — clear the download quarantine (see README)"
  : "App is not running with admin/elevated privileges";

const READER_ERROR_TEXT = IS_MAC
  ? "Reader error — see the macOS setup notes in the README"
  : "Reader error — try running the app as administrator";

export default function ReaderStatus() {
  const [readerStatus, setReaderStatus] = useState("warn");

  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    // The probes are async (native threadpool); skip a tick if the previous
    // one is still in flight so slow reads don't pile up.
    let busy = false;
    let alive = true;

    const interval = setInterval(async () => {
      if (busy) return;
      busy = true;
      // Every reader call opens the game process (OpenProcess on Windows,
      // task_for_pid on macOS) and fails without the right privileges. Guard
      // the whole tick so a reader error surfaces as a status instead of
      // crashing the app with a dev error overlay.
      try {
        // Access first: nothing else can work without it, so don't even
        // attempt to probe the process or read memory in that case.
        if (!checkAdmin()) {
          if (alive) {
            setReaderStatus("err");
            setErrorText(NO_ACCESS_TEXT);
          }
          return;
        }

        if (!(await findMTGA())) {
          if (alive) {
            setReaderStatus("err");
            setErrorText("MTGA process not found");
          }
          return;
        }

        // Access granted and MTGA is running — confirm we can really read.
        if (!(await readPlayerTest())) {
          if (alive) {
            setReaderStatus("warn");
            setErrorText("Waiting for MTGA data…");
          }
          return;
        }

        if (alive) {
          setReaderStatus("ok");
          setErrorText("");
        }
      } catch {
        if (alive) {
          setReaderStatus("err");
          setErrorText(READER_ERROR_TEXT);
        }
      } finally {
        busy = false;
      }
    }, 1000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <div style={{ margin: "24px 0 12px 0" }}>
        <p>
          MTG Arena Tool reads the MTGA game process memory to get some of the
          game data.{" "}
          {IS_MAC
            ? "If you have issues with it, make sure the app is not quarantined — see the macOS notes in the README."
            : "If you have any issues with it try running the app with administrator privileges."}
        </p>
      </div>
      <div
        style={{
          display: "flex",
          height: "40px",
        }}
      >
        <label className="label">MTGA Process:</label>
        <label
          style={{
            fontFamily: "var(--main-font-name-it)",
            color: "var(--color-r)",
            margin: "auto 16px auto auto",
          }}
        >
          {errorText}
        </label>
        <div className={`log-status-${readerStatus}`} />
      </div>
    </>
  );
}
