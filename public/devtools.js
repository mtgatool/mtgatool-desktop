/* eslint-disable import/no-extraneous-dependencies */
const {
  default: installExtension,
  REDUX_DEVTOOLS,
  REACT_DEVELOPER_TOOLS,
} = require("electron-devtools-installer");

function installDevTools() {
  console.log(`INSTALLING DEV TOOLS..`);
  [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS].forEach((ext) => {
    installExtension(ext)
      .then((name) => console.log(`Added ${name}`))
      .catch((err) => console.log(err));
  });
}

module.exports = installDevTools;
