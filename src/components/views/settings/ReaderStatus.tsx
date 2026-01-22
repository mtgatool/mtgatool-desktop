import { useEffect, useState } from "react";

import readPlayerTest from "../../../reader/readPlayerTest";
import { findProcess, isAdmin } from "../../../utils/mtgaReader";

async function findMTGA(): Promise<boolean> {
  const pid = await findProcess("MTGA");
  return pid !== null;
}

async function checkAdmin(): Promise<boolean> {
  return isAdmin();
}

export default function ReaderStatus() {
  const [readerStatus, setReaderStatus] = useState("warn");

  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    const interval = setInterval(async () => {
      const found = await findMTGA();
      const admin = await checkAdmin();
      const player = await readPlayerTest();

      if (found) {
        if (!player && !admin) {
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
