import axios from "axios";
import fs from "fs";
import path from "path";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import extract from "extract-zip";
import tar from "tar-fs";
import zlib from "zlib";
import electron from "../utils/electron/electronWrapper";
import downloadFile from "../utils/downloadFile";
import globalData from "../utils/globalData";
import isElectron from "../utils/electron/isElectron";

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

const os: string = isElectron() ? process.platform : "";

export default class MtgaTrackerDaemon {
  private _port = 6842;

  private _version = "0.0.0.0";

  private _url = `http://localhost:${this._port}`;

  private _daemonProcess: ChildProcessWithoutNullStreams | undefined;

  private _daemonExecutablePath: string | null = null;

  constructor(port = 6842) {
    this._port = port;
    this._url = `http://localhost:${this._port}`;

    if (isElectron() && os === "win32") {
      this.setupDaemon();
    }
  }

  get version() {
    return this._version;
  }

  public downloadLatestDaemon() {
    console.log("mtgaTrackerDaemon downloadLatestDaemon");
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

      if (isElectron() && fs.existsSync(downloadPath)) {
        fs.unlinkSync(downloadPath);
      }

      console.log(
        "mtgaTrackerDaemon update?",
        globalData.latestDaemon?.tag_name,
        this._version
      );
      if (
        globalData.latestDaemon &&
        globalData.latestDaemon.tag_name > this._version
      ) {
        const downloadUrl = globalData.latestDaemon.assets.filter(
          (a: any) => a.name === zipName
        )[0].browser_download_url;

        downloadFile(downloadUrl, downloadPath)
          .then(() => {
            this.shutdown()
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
      } else {
        reject();
      }
    });
  }

  public setupDaemon() {
    if (!electron) return;
    console.log("mtgaTrackerDaemon Setup Daemon");

    const electronApp =
      electron.app || (electron.remote && electron.remote.app);

    this._daemonExecutablePath = path.join(
      electronApp.getPath("userData"),
      "daemon",
      "bin",
      os === "win32" ? "mtga-tracker-daemon.exe" : "mtga-tracker-daemon"
    );

    this.startDaemon();
  }

  // eslint-disable-next-line class-methods-use-this
  public startDaemon() {
    if (os !== "win32") return;

    if (this._daemonExecutablePath) {
      const daemonExists =
        isElectron() && fs.existsSync(this._daemonExecutablePath);

      if (daemonExists) {
        // Start the process
        if (this._daemonExecutablePath && !this._daemonProcess) {
          console.log("mtgaTrackerDaemon Starting Daemon..");
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
                  this._version = status.daemonVersion;
                  if (os === "win32") {
                    this.downloadLatestDaemon().then(() => this.startDaemon);
                  } else {
                    this.checkForUpdates();
                  }
                }
              });
            }, 200);
          }
        }
      } else {
        this.downloadLatestDaemon().then(() => this.startDaemon);
      }
    }
  }

  public shutdown() {
    console.log("mtgaTrackerDaemon shutdown()");
    return axios
      .post(`${this._url}/shutdown`)
      .then((d) => {
        this._daemonProcess = undefined;
        return d.data.result;
      })
      .catch((e) => {
        return { result: e.message };
      });
  }

  public checkForUpdates(): Promise<boolean> {
    console.log("mtgaTrackerDaemon checkForUpdates()");
    return axios
      .get<{ updatesAvailable: boolean }>(`${this._url}/checkForUpdates`)
      .then((d) => d.data.updatesAvailable)
      .catch(() => false);
  }

  public getCards(): Promise<Card[]> {
    console.log("mtgaTrackerDaemon getCards()");
    return axios
      .get<DaemonCards>(`${this._url}/cards`)
      .then((d) => d.data.cards)
      .catch(() => []);
  }

  public getPlayerId(): Promise<string | null> {
    console.log("mtgaTrackerDaemon getPlayerId()");
    return axios
      .get(`${this._url}/playerId`)
      .then((d) => d.data.playerId)
      .catch(() => null);
  }

  public getInventory(): Promise<DaemonInventory | null> {
    console.log("mtgaTrackerDaemon getInventory()");
    return axios
      .get<DaemonInventory>(`${this._url}/inventory`)
      .then((d) => d.data)
      .catch(() => null);
  }

  public isDaemonRunning(): Promise<boolean> {
    console.log("mtgaTrackerDaemon isDaemonRunning()");
    return axios
      .get<boolean>(`${this._url}/status`)
      .then(() => true)
      .catch(() => false);
  }

  public getStatus(): Promise<DaemonStatus | null> {
    console.log("mtgaTrackerDaemon getStatus()");
    return axios
      .get<DaemonStatus>(`${this._url}/status`)
      .then((d) => d.data)
      .catch(() => null);
  }
}
