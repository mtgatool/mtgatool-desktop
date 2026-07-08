
const WebpackReactComponentNamePlugin = require("webpack-react-component-name");
const ModuleReplacement = require("./module-resolver-file");
const supabaseCjsAlias = require("./supabaseCjsAlias");
const eslintConfig = require("./.eslintrc");

process.env.GENERATE_SOURCEMAP = true;

// Tauri build configuration (now the default)
// https://www.npmjs.com/package/@craco/craco
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.target = "web";
      webpackConfig.node = { ...webpackConfig.node, fs: "empty" };
      // See craco.tauri.config.js / supabaseCjsAlias.js.
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        ...supabaseCjsAlias(),
      };
      return webpackConfig;
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
