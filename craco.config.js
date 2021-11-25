const ModuleReplacement = require("./module-resolver-file");
const eslintConfig = require("./.eslintrc");

// https://www.npmjs.com/package/@craco/craco
module.exports = {
  webpack: {
    configure: {
      target: "electron-renderer",
      module: {
        rules: [
          {
            test: /\.node$/,
            use: "native-addon-loader",
          },
        ],
      },
      node: {
        fs: "empty",
      },
    },
    plugins: [...ModuleReplacement({ webIndex: false, electronIndex: true })],
  },
  eslint: {
    configure: eslintConfig,
  },
};
