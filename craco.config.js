
const WebpackReactComponentNamePlugin = require("webpack-react-component-name");
const ModuleReplacement = require("./module-resolver-file");
const eslintConfig = require("./.eslintrc");
const supabaseCjsAlias = require("./supabaseCjsAlias");

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
      // Force every @supabase/* package onto its CommonJS build. supabase-js v2
      // ships .mjs re-exports that webpack 4 (react-scripts 4) can't analyze
      // ("Attempted import error: createClient is not exported"). See
      // supabaseCjsAlias.js.
      resolve: {
        alias: {
          ...supabaseCjsAlias(),
        },
      },
    },
    plugins: [
      ...ModuleReplacement({ webIndex: false, electronIndex: true }),
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
