const net = require("net");
const childProcess = require("child_process");

const port = process.env.PORT ? process.env.PORT - 100 : 3001;

process.env.ELECTRON_START_URL = `http://localhost:${port}`;

const client = new net.Socket();

let startedElectron = false;
const tryConnection = () => {
  client.connect({ port }, () => {
    client.end();
    if (!startedElectron) {
      console.log("starting electron");
      startedElectron = true;
      const { spawn } = childProcess;
      // "npm.cmd" for windows, "npm" on the other OS!
      // shell:true is required on Windows since Node 20 (CVE-2024-27980):
      // spawning a .cmd/.bat directly now throws EINVAL. Running through the
      // shell restores the pre-Node-20 behaviour.
      const ls = spawn(
        process.platform === "win32" ? "npm.cmd" : "npm",
        ["run", "electron"],
        { shell: true }
      );
      ls.stdout.on("data", (data) => {
        console.log(data.toString());
      });

      ls.stderr.on("data", (data) => {
        console.error(data.toString());
      });

      ls.on("exit", (code) => {
        console.warn(`child process exited with code ${code}`);
      });
    }
  });
};

tryConnection();

client.on("error", () => {
  setTimeout(tryConnection, 1000);
});
