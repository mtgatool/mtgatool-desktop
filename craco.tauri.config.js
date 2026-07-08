const WebpackReactComponentNamePlugin = require("webpack-react-component-name");
const ModuleReplacement = require("./module-resolver-file");
const supabaseCjsAlias = require("./supabaseCjsAlias");
const eslintConfig = require("./.eslintrc");

process.env.GENERATE_SOURCEMAP = true;
process.env.PORT = 3001;

// Tauri build configuration
// Targets web instead of electron-renderer
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.target = "web";
      webpackConfig.node = { ...webpackConfig.node, fs: "empty" };
      // Force @supabase/* onto their CJS builds so webpack 4 (CRA 4) doesn't
      // choke on the ESM .mjs named re-exports. See supabaseCjsAlias.js.
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        ...supabaseCjsAlias(),
      };
      return webpackConfig;
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
