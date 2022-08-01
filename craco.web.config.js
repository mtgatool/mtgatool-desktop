const ModuleReplacement = require("./module-resolver-file");
const WebpackReactComponentNamePlugin = require("webpack-react-component-name");

process.env.PORT = 3006;

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
};
