const net = require("net");
const childProcess = require("child_process");

const port = process.env.PORT ? process.env.PORT - 100 : 3001;

process.env.ELECTRON_START_URL = `http://localhost:${port}`;

let startedElectron = false;

const tryConnection = () => {
  // Create a new socket for each connection attempt to avoid listener accumulation
  const client = new net.Socket();

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
        console.warn(`child process exited with code ${code.toString()}`);
      });
    }
  });

  client.on("error", () => {
    client.destroy();
    setTimeout(tryConnection, 1000);
  });
};

tryConnection();
