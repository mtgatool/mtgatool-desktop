const ModuleReplacement = require("./module-resolver-file");
const WebpackReactComponentNamePlugin = require("webpack-react-component-name");
const supabaseCjsAlias = require("./supabaseCjsAlias");

process.env.PORT = 3006;

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
      ...ModuleReplacement({ webIndex: true, electronIndex: false }),
      new WebpackReactComponentNamePlugin()
    ],
  },
  eslint: {
    configure: {
      rules: {
        "no-underscore-dangle": "off",
      },
    },
  },
  jest: {
    configure: {
      setupFiles: ['./jest.setup.js']
    },
  },
};
