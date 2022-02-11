const ModuleReplacement = require("./module-resolver-file");
const eslintConfig = require("./.eslintrc");

process.env.GENERATE_SOURCEMAP = true;

// https://www.npmjs.com/package/@craco/craco
module.exports = {
  webpack: {
    optimization: {
      minimize: false,
    },
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
