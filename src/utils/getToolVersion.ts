import electron from "./electron/electronWrapper";

/* eslint-disable radix */
export default function getToolVersion(): number {
  if (!electron)
    return parseInt(
      (process.env.REACT_APP_VERSION || "")
        .split(".")
        .reduce((acc, cur) => `${+acc * 256 + +cur}`)
    );
  return parseInt(
    (electron.app || electron.remote.app)
      .getVersion()
      .split(".")
      .reduce((acc, cur) => `${+acc * 256 + +cur}`)
  );
}
