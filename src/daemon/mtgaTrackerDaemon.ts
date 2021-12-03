import axios from "axios";
import fs from "fs";
import path from "path";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import extract from "extract-zip";
import tar from "tar-fs";
import zlib from "zlib";
import electron from "../utils/electron/electronWrapper";
import downloadFile from "../utils/downloadFile";

interface DaemonInventory {
  gems: number;
  gold: number;
  elapsedTime: number;
}

interface Card {
  grpId: number;
  owned: number;
}

interface DaemonCards {
  cards: Card[];
  elapsedTime: number;
}

interface DaemonStatus {
  isRunning: boolean;
  daemonVersion: string;
  updating: boolean;
  processId: number | -1;
}

const os: string = electron ? process.platform : "";

export default class MtgaTrackerDaemon {
  private _port = 6842;

  private _version = "0.0.0.0";

  private _url = `http://localhost:${this._port}`;

  private _daemonProcess: ChildProcessWithoutNullStreams | undefined;

  private _daemonExecutablePath: string | null = null;

  constructor(port = 6842) {
    this._port = port;
    this._url = `http://localhost:${this._port}`;

    if (os === "win32") {
      this.setupDaemon();
    }
  }

  get version() {
    return this._version;
  }

  public downloadLatestDaemon() {
    return new Promise((resolve, reject) => {
      if (!electron) {
        reject();
        return;
      }

      const electronApp =
        electron.app || (electron.remote && electron.remote.app);

      this._daemonExecutablePath = path.join(
        electronApp.getPath("userData"),
        "daemon",
        "bin",
        os === "win32" ? "mtga-tracker-daemon.exe" : "mtga-tracker-daemon"
      );

      const daemonDir = path.join(electronApp.getPath("userData"), "daemon");

      const zipName =
        os === "win32"
          ? "mtga-tracker-daemon-Windows.zip"
          : "mtga-tracker-daemon-Linux.tar.gz";

      const downloadPath = path.join(electronApp.getPath("userData"), zipName);

      if (fs.existsSync(downloadPath)) {
        fs.unlinkSync(downloadPath);
      }

      axios
        .get(
          "https://api.github.com/repos/frcaton/mtga-tracker-daemon/releases/latest"
        )
        .then((result) => {
          const downloadUrl = result.data.assets.filter(
            (a: any) => a.name === zipName
          )[0].browser_download_url;

          downloadFile(downloadUrl, downloadPath)
            .then(() => {
              if (os === "win32") {
                extract(downloadPath, { dir: daemonDir })
                  .then(resolve)
                  .catch(reject);
              } else {
                const untar = fs
                  .createReadStream(downloadPath)
                  .pipe(zlib.createGunzip())
                  .pipe(tar.extract(daemonDir));

                untar.on("end", resolve);
                untar.on("error", reject);
              }
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  public setupDaemon() {
    if (!electron) return;
    console.log("Setup MTGA Tracker Daemon");

    const electronApp =
      electron.app || (electron.remote && electron.remote.app);

    this._daemonExecutablePath = path.join(
      electronApp.getPath("userData"),
      "daemon",
      "bin",
      os === "win32" ? "mtga-tracker-daemon.exe" : "mtga-tracker-daemon"
    );

    if (!fs.existsSync(this._daemonExecutablePath)) {
      this.downloadLatestDaemon().then(this.startDaemon);
    } else {
      this.startDaemon();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public startDaemon() {
    if (os !== "win32") return;

    // Start the process
    if (this._daemonExecutablePath && !this._daemonProcess) {
      console.log("Starting Daemon..");
      this._daemonProcess = spawn(this._daemonExecutablePath, [], {});

      if (this._daemonProcess) {
        this._daemonProcess.on("exit", (code) => {
          console.log("MtgaTrackerDaemon exit", code);
        });

        this._daemonProcess.on("error", (error) => {
          console.log("MtgaTrackerDaemon error", error);
        });

        setTimeout(() => {
          this.getStatus().then((status) => {
            if (status) {
              if (
                this._version !== "0.0.0.0" &&
                status.daemonVersion > this._version
              ) {
                if (os === "win32") {
                  this.downloadLatestDaemon().then(this.startDaemon);
                } else {
                  this.checkForUpdates();
                }
              }
              this._version = status.daemonVersion;
            }
          });
        }, 200);
      }
    }
  }

  public shutdown() {
    return axios
      .post(`${this._url}/shutdown`)
      .then((d) => d.data.result)
      .catch((e) => {
        return { result: e.message };
      });
  }

  public checkForUpdates(): Promise<boolean> {
    return axios
      .get<{ updatesAvailable: boolean }>(`${this._url}/checkForUpdates`)
      .then((d) => d.data.updatesAvailable)
      .catch(() => false);
  }

  public getCards(): Promise<Card[]> {
    return axios
      .get<DaemonCards>(`${this._url}/cards`)
      .then((d) => d.data.cards)
      .catch(() => []);
  }

  public getPlayerId(): Promise<string | null> {
    return axios
      .get(`${this._url}/playerId`)
      .then((d) => d.data.playerId)
      .catch(() => null);
  }

  public getInventory(): Promise<DaemonInventory | null> {
    return axios
      .get<DaemonInventory>(`${this._url}/inventory`)
      .then((d) => d.data)
      .catch(() => null);
  }

  public isDaemonRunning(): Promise<boolean> {
    return axios
      .get<boolean>(`${this._url}/status`)
      .then(() => true)
      .catch(() => false);
  }

  public getStatus(): Promise<DaemonStatus | null> {
    return axios
      .get<DaemonStatus>(`${this._url}/status`)
      .then((d) => d.data)
      .catch(() => null);
  }
}
