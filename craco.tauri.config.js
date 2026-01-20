const WebpackReactComponentNamePlugin = require("webpack-react-component-name");
const ModuleReplacement = require("./module-resolver-file");
const eslintConfig = require("./.eslintrc");

process.env.GENERATE_SOURCEMAP = true;
process.env.PORT = 3001;

// Tauri build configuration
// Targets web instead of electron-renderer
module.exports = {
  webpack: {
    configure: {
      target: "web",
      node: {
        fs: "empty",
      },
    },
    plugins: [
      // Disable web index, enable Tauri index
      ...ModuleReplacement({
        webIndex: false,
        tauriIndex: true,
      }),
      new WebpackReactComponentNamePlugin(),
    ],
  },
  eslint: {
    configure: eslintConfig,
  },
  jest: {
    configure: {
      setupFiles: ["./jest.setup.js"],
    },
  },
};
