import "./index.scss";

import { useEffect, useState } from "react";

import isTauri from "../utils/tauri/isTauri";

function toMb(bytes: number): number {
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
}

interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  total: number;
  transferred: number;
}

function Updater(): JSX.Element {
  const [state, setState] = useState<UpdateProgress>({
    percent: 0,
    bytesPerSecond: 0,
    total: 0,
    transferred: 0,
  });
  const [status, setStatus] = useState<string>("Checking for updates..");

  useEffect(() => {
    if (!isTauri()) return;

    const checkForUpdates = async () => {
      try {
        const { check } = await import("@tauri-apps/plugin-updater");

        // Check for updates (v2 returns an Update handle or null)
        const update = await check();
        if (update) {
          setStatus("Downloading update...");
          let downloaded = 0;
          let contentLength = 0;
          // v2 delivers download progress through a callback, not an event.
          await update.downloadAndInstall((event) => {
            switch (event.event) {
              case "Started":
                contentLength = event.data.contentLength || 0;
                setState((prev) => ({ ...prev, total: contentLength }));
                break;
              case "Progress":
                downloaded += event.data.chunkLength;
                setState((prev) => ({
                  ...prev,
                  transferred: downloaded,
                  total: contentLength,
                  percent: contentLength
                    ? (downloaded / contentLength) * 100
                    : 0,
                }));
                break;
              case "Finished":
                setState((prev) => ({ ...prev, percent: 100 }));
                break;
              default:
                break;
            }
          });
          setStatus("Update installed! Restarting...");
        } else {
          setStatus("No updates available");
        }
      } catch (e) {
        console.error("Update check failed:", e);
        setStatus("Update check failed");
      }
    };

    checkForUpdates();
  }, []);

  const progress = state.percent;
  const speed = Math.round(state.bytesPerSecond / 1024);

  const totalMb = toMb(state.total);
  const transferredMb = toMb(state.transferred);

  return (
    <div className="updater-wrapper">
      <div className="spinner" />
      <div className="bar-container">
        <div
          className="progress-bar"
          style={{ width: `${Math.round(progress)}%` }}
        />
        <div className="progress-text">
          {state.percent
            ? ` ${transferredMb}mb / ${totalMb}mb ${
                speed ? `(${speed}kb/s)` : ""
              }`
            : status}
        </div>
      </div>
    </div>
  );
}

export default Updater;
