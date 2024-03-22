import find from "find-process";

import globalData from "../utils/globalData";

export default function initReader() {
  // eslint-disable-next-line no-undef
  const { MtgaReader } = __non_webpack_require__("mtga-reader");
  globalData.mtgaReader = new MtgaReader();

  function tryReconnect() {
    if (globalData.mtgaReader.isConnected()) {
      // skip
    } else {
      find("name", "MTGA", true).then((list: any) => {
        if (list.length === 0) return;
        const firstPid = list[0].pid;
        try {
          globalData.mtgaReader.connect(firstPid);
        } catch (e) {
          console.debug(e);
        }
      });
    }
  }

  setInterval(tryReconnect, 2500);
}
