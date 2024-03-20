import find from "find-process";

import globalData from "../utils/globalData";

// eslint-disable-next-line no-undef
const { MtgaReader } = __non_webpack_require__("mtga-reader");

export default function initReader() {
  globalData.mtgaReader = new MtgaReader();
  let interval: any = null;

  function tryReconnect() {
    if (globalData.mtgaReader.isConnected()) {
      clearInterval(interval);
      interval = null;
    } else {
      find("name", "MTGA", true).then((list: any) => {
        if (list.length === 0) return;
        const firstPid = list[0].pid;
        globalData.mtgaReader.connect(firstPid);
      });
    }
  }

  globalData.mtgaReader.on("disconnect", () => {
    interval = setInterval(tryReconnect, 2500);
  });

  globalData.mtgaReader.on("connect", () => {
    clearInterval(interval);
    interval = null;
  });

  tryReconnect();
}
