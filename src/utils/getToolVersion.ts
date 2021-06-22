import electron from "./electron/electronWrapper";

/* eslint-disable radix */
export default function getToolVersion(): number {
  const base = !electron
    ? process.env.REACT_APP_VERSION || ""
    : (electron.app || electron.remote.app).getVersion();

  return parseInt(base.split(".").reduce((acc, cur) => `${+acc * 256 + +cur}`));
}
