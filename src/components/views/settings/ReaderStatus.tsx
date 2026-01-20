import { useEffect, useState } from "react";

import readPlayerTest from "../../../reader/readPlayerTest";
import isTauri from "../../../utils/tauri/isTauri";

function findMTGA(): boolean {
  // In Tauri, native modules aren't available in the browser context
  // This functionality would need to be implemented via Tauri commands
  if (isTauri()) {
    // TODO: Implement via Tauri command
    return false;
  }

  try {
    // eslint-disable-next-line no-undef
    const reader = __non_webpack_require__("mtga-reader");
    const { findPidByName } = reader;
    return findPidByName("MTGA");
  } catch (error) {
    console.error("Failed to access mtga-reader:", error);
    return false;
  }
}

function checkAdmin(): boolean {
  // In Tauri, native modules aren't available in the browser context
  // This functionality would need to be implemented via Tauri commands
  if (isTauri()) {
    // TODO: Implement via Tauri command
    return false;
  }

  try {
    // eslint-disable-next-line no-undef
    const reader = __non_webpack_require__("mtga-reader");
    const { isAdmin } = reader;
    return isAdmin();
  } catch (error) {
    console.error("Failed to access mtga-reader:", error);
    return false;
  }
}

export default function ReaderStatus() {
  const [readerStatus, setReaderStatus] = useState("warn");

  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    // In Tauri, the reader functionality isn't available yet
    if (isTauri()) {
      setReaderStatus("warn");
      setErrorText(
        "Reader functionality not available in Tauri (requires native module implementation)"
      );
      return undefined;
    }

    const interval = setInterval(() => {
      const found = findMTGA();
      const isAdmin = checkAdmin();
      const player = readPlayerTest();

      if (found) {
        if (!player && !isAdmin) {
          setReaderStatus("err");
          setErrorText("App is not running with admin/elevated privileges");
          return;
        }

        setReaderStatus("ok");
      } else {
        setReaderStatus("err");
        setErrorText("MTGA process not found");
      }
    }, 1000);
    return () => clearInterval(interval);
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
