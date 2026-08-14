import { useEffect, useState } from "react";

import readPlayerTest from "../../../reader/readPlayerTest";
import { getReader } from "../../../utils/mtgaReader";
import StatusPill, { StatusState } from "../../ui/StatusPill";

function findMTGA(): Promise<boolean> {
  const reader = getReader();
  // mtga-reader 0.1.7: findProcess is async (threadpool) and resolves to a
  // boolean "is it running".
  const { findProcess } = reader;
  return findProcess("MTGA");
}

function checkAdmin(): boolean {
  const reader = getReader();
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

/**
 * One object rather than a status and a loose string: every branch below sets
 * both, and holding them apart let them disagree — a stale error line could sit
 * under a green dot for a tick.
 */
interface Status {
  state: StatusState;
  /** A word or two, for the pill. */
  label: string;
  /** The part that needs a sentence, shown under the note. */
  detail?: string;
  /** Whether that sentence is something to act on. */
  bad?: boolean;
}

export default function ReaderStatus() {
  const [status, setStatus] = useState<Status>({
    state: "warn",
    label: "Checking…",
  });

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
            setStatus({
              state: "err",
              label: "No access",
              detail: NO_ACCESS_TEXT,
              bad: true,
            });
          }
          return;
        }

        if (!(await findMTGA())) {
          if (alive) {
            // Not an error on the tracker's part — the game simply is not open,
            // which is the usual state of this screen.
            setStatus({
              state: "warn",
              label: "Not running",
              detail: "MTGA is not running — start the game to connect.",
            });
          }
          return;
        }

        // Access granted and MTGA is running — confirm we can really read.
        if (!(await readPlayerTest())) {
          if (alive) {
            setStatus({
              state: "warn",
              label: "Waiting",
              detail: "Connected to MTGA, waiting for game data…",
            });
          }
          return;
        }

        if (alive) {
          setStatus({ state: "ok", label: "Connected" });
        }
      } catch {
        if (alive) {
          setStatus({
            state: "err",
            label: "Error",
            detail: READER_ERROR_TEXT,
            bad: true,
          });
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
    <div className="panel-card">
      <div className="panel-card-head">
        <div className="panel-card-title">Game memory</div>
        <StatusPill
          state={status.state}
          label={status.label}
          title={status.detail}
        />
      </div>

      <p className="panel-note">
        MTG Arena Tool reads the MTGA game process memory to get some of the
        game data.{" "}
        {IS_MAC
          ? "If you have issues with it, make sure the app is not quarantined — see the macOS notes in the README."
          : "If you have any issues with it try running the app with administrator privileges."}
      </p>

      {status.detail ? (
        <p className={`panel-note ${status.bad ? "err" : ""}`}>
          {status.detail}
        </p>
      ) : null}
    </div>
  );
}
