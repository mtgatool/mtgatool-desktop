import "./index.scss";

import { ipcRenderer as ipc } from "electron";
import { useState } from "react";

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

  ipc.on("update_progress", (_event, s: any) => {
    setState(s);
  });

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
            ? ` ${transferredMb}mb / ${totalMb}mb (${speed}kb/s)`
            : "Checking for updates.."}
        </div>
      </div>
    </div>
  );
}

export default Updater;
