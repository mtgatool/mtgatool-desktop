import { app, remote } from "electron";

/* eslint-disable radix */
export default function getToolVersion(): number {
  return parseInt(
    (app || remote.app)
      .getVersion()
      .split(".")
      .reduce((acc, cur) => `${+acc * 256 + +cur}`)
  );
}
