const ModuleReplacement = require("./module-resolver-file");

process.env.PORT = 4000;

// https://www.npmjs.com/package/@craco/craco
module.exports = {
  webpack: {
    configure: {
      target: "web",
      module: {
        noParse: /gun\.js$/,
      },
      node: {
        fs: "empty",
      },
    },
    plugins: [...ModuleReplacement({ webIndex: true, electronIndex: false })],
  },
  eslint: {
    configure: {
      rules: {
        "no-underscore-dangle": "off",
      },
    },
  },
};
