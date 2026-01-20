
const WebpackReactComponentNamePlugin = require("webpack-react-component-name");
const ModuleReplacement = require("./module-resolver-file");
const eslintConfig = require("./.eslintrc");

process.env.GENERATE_SOURCEMAP = true;

// Tauri build configuration (now the default)
// https://www.npmjs.com/package/@craco/craco
module.exports = {
  webpack: {
    configure: {
      target: "web",
      node: {
        fs: "empty",
      },
    },
    plugins: [
      ...ModuleReplacement({ webIndex: false, tauriIndex: true }),
      new WebpackReactComponentNamePlugin(),
    ],
  },
  eslint: {
    configure: eslintConfig,
  },
  jest: {
    configure: {
      setupFiles: ['./jest.setup.js']
    },
  },
};
