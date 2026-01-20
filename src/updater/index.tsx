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
        const { checkUpdate, installUpdate } = await import(
          "@tauri-apps/api/updater"
        );
        const { listen } = await import("@tauri-apps/api/event");

        // Listen for update progress
        const unlisten = await listen<{
          chunkLength: number;
          contentLength: number;
        }>("tauri://update-download-progress", (event) => {
          const { chunkLength, contentLength } = event.payload;
          const percent = contentLength
            ? (chunkLength / contentLength) * 100
            : 0;
          setState((prev) => ({
            ...prev,
            percent,
            total: contentLength || 0,
            transferred: chunkLength || 0,
          }));
        });

        // Check for updates
        const update = await checkUpdate();
        if (update.shouldUpdate) {
          setStatus("Downloading update...");
          await installUpdate();
          setStatus("Update installed! Restarting...");
        } else {
          setStatus("No updates available");
        }

        return () => {
          unlisten();
        };
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
            ? ` ${transferredMb}mb / ${totalMb}mb ${speed ? `(${speed}kb/s)` : ""}`
            : status}
        </div>
      </div>
    </div>
  );
}

export default Updater;
