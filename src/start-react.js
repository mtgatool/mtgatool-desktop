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
      const ls = spawn(process.platform === "win32" ? "npm.cmd" : "npm", [
        "run",
        "electron",
      ]);
      ls.stdout.on("data", (data) => {
        console.log(data.toString());
      });

      ls.stderr.on("data", (data) => {
        console.error(data.toString());
      });

      ls.on("exit", (code) => {
        console.warning(`child process exited with code ${code.toString()}`);
      });
    }
  });
};

tryConnection();

client.on("error", () => {
  setTimeout(tryConnection, 1000);
});
