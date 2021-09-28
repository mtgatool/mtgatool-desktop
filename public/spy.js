/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line import/no-extraneous-dependencies
const ffi = require("ffi-napi");

function Spy() {
  const MtgaSpy = new ffi.Library(`${__dirname}/extra/HackF5.UnitySpy`, {
    GetPID: ["int", ["string"]],
    GetUUID: ["string", ["int"]],
  });
  console.log("MtgaSpy ok");

  let processId = -1;

  this.getUUID = () => {
    let uuid = "";
    if (processId !== -1) {
      uuid = MtgaSpy.GetUUID(processId);
    }
    return uuid;
  };

  const checkProcess = () => {
    processId = MtgaSpy.GetPID("MTGA");
    setTimeout(checkProcess, 1000);
  };

  checkProcess();

  return this;
}

module.exports = Spy;
