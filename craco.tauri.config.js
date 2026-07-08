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

      // The @tauri-apps/* v2 packages ship modern syntax (?? , ?., ??=) that
      // webpack 4's parser can't handle, and babel-preset-react-app's modern
      // browserslist target leaves it untransformed. Force-transform those
      // operators by appending explicit plugins to CRA's existing node_modules
      // ("dependencies") babel-loader.
      const forceModernSyntaxPlugins = [
        require.resolve("@babel/plugin-proposal-optional-chaining"),
        require.resolve("@babel/plugin-proposal-nullish-coalescing-operator"),
        require.resolve("@babel/plugin-proposal-logical-assignment-operators"),
      ];
      webpackConfig.module.rules.forEach((rule) => {
        if (!Array.isArray(rule.oneOf)) return;
        rule.oneOf.forEach((one) => {
          const isDepsBabel =
            one.loader &&
            one.loader.includes("babel-loader") &&
            one.options &&
            Array.isArray(one.options.presets) &&
            JSON.stringify(one.options.presets).includes(
              "preset-react-app/dependencies"
            );
          if (isDepsBabel) {
            one.options.plugins = [
              ...(one.options.plugins || []),
              ...forceModernSyntaxPlugins,
            ];
          }
        });
      });

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
