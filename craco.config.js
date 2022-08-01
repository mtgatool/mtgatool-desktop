const ModuleReplacement = require("./module-resolver-file");
const WebpackReactComponentNamePlugin = require("webpack-react-component-name");
const eslintConfig = require("./.eslintrc");

process.env.GENERATE_SOURCEMAP = true;

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
    plugins: [
      ...ModuleReplacement({ webIndex: false, electronIndex: true }),
      new WebpackReactComponentNamePlugin()
    ],
  },
  eslint: {
    configure: eslintConfig,
  },
};
