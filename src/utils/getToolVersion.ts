import info from "../info.json";

/* eslint-disable radix */
export default function getToolVersion(): number {
  return parseInt(
    info.version.split(".").reduce((acc, cur) => `${+acc * 256 + +cur}`)
  );
}
