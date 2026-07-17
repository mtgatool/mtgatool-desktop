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
  return isAdmin();
}

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
      // Every reader call goes through OpenProcess, which fails without
      // elevation. Guard the whole tick so a reader error surfaces as a status
      // instead of crashing the app with a dev error overlay.
      try {
        // Admin first: nothing else can work unelevated, so don't even attempt
        // to probe the process or read memory in that case.
        if (!checkAdmin()) {
          if (alive) {
            setReaderStatus("err");
            setErrorText("App is not running with admin/elevated privileges");
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

        // Elevated and MTGA is running — confirm we can actually read memory.
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
          setErrorText("Reader error — try running the app as administrator");
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
          MTG Arena Tool reads the MTGA game process memory to get the some of
          the game data, if you have any issues with it try running the app with
          administrator privileges.
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
