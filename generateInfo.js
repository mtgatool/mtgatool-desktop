const fs = require("fs");
const { exec } = require("child_process");

function generateInfo(branchName) {
  const packageJson = JSON.parse(fs.readFileSync("./package.json"));

  const informationObject = {
    version: packageJson.version,
    branch: `v${packageJson.version}` == branchName ? "master" : branchName,
    timestamp: new Date().getTime(),
  };

  console.log("SET INFO VERSION");
  console.log(informationObject.version);

  fs.writeFileSync("./src/info.json", JSON.stringify(informationObject));
}

exec("git rev-parse --abbrev-ref HEAD", (err, stdout) => {
  if (err) {
    console.log(err);
  } else if (typeof stdout === "string") {
    const branchName =
      process.env.TRAVIS_BRANCH ||
      process.env.TRAVIS_BUILD_NUMBER ||
      stdout.trim();

    generateInfo(branchName);
  }
});
