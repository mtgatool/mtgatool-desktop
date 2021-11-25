const fs = require("fs");

const packageJson = JSON.parse(fs.readFileSync("./package.json"));

packageJson.homepage = "http://localhost:4000";

fs.writeFileSync("./package.json", JSON.stringify(packageJson));
