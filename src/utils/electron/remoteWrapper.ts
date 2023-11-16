/* eslint-disable no-undef */
import isElectron from "./isElectron";

// eslint-disable-next-line import/no-mutable-exports
let remote: any | null = null;
if (isElectron()) {
  // eslint-disable-next-line global-require
  remote = __non_webpack_require__("@electron/remote");
  // (window as any).remote = remote;
  // console.log("remote", remote);
}

export default remote;
