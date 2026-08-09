
const path = require("path");

const WebpackReactComponentNamePlugin = require("webpack-react-component-name");
const ModuleReplacement = require("./module-resolver-file");
const eslintConfig = require("./.eslintrc");
const supabaseCjsAlias = require("./supabaseCjsAlias");

process.env.GENERATE_SOURCEMAP = true;

/**
 * A second entry + HTML for the "look past the game" windows.
 *
 * The card hover, match overlays and post-match overview load `overlay.html`
 * (entry `src/overlayIndex.tsx`) instead of `index.html`. That entry imports
 * only those three component trees, so webpack keeps the whole main-app graph —
 * App and its views, the router, the log watcher / GRE parser, the memory
 * reader, the cloud sync — out of the chunks this HTML loads. Each of these
 * windows is its own Chromium renderer, and this is what stops every one of
 * them paying the memory cost of code it never runs.
 *
 * Uses entry-point-based chunk selection (`chunks: ['main' | 'overlay']`), so
 * each HTML gets its own entry, its runtime, and only the shared/vendor chunks
 * that entry actually uses — main-only vendor code never reaches overlay.html.
 */
function addOverlayEntry(webpackConfig) {
  const overlayEntry = path.resolve(__dirname, "src/overlayIndex.tsx");
  webpackConfig.entry = {
    main: webpackConfig.entry,
    overlay: overlayEntry,
  };

  // Dev output is `static/js/bundle.js` with no [name], which two entries would
  // collide on; production already carries [name]. Only rewrite when missing.
  if (
    webpackConfig.output &&
    typeof webpackConfig.output.filename === "string" &&
    !webpackConfig.output.filename.includes("[name]")
  ) {
    webpackConfig.output.filename = "static/js/[name].bundle.js";
  }

  const mainHtml = webpackConfig.plugins.find(
    (p) => p.constructor && p.constructor.name === "HtmlWebpackPlugin"
  );
  if (!mainHtml) {
    throw new Error("craco: HtmlWebpackPlugin not found — CRA config changed?");
  }
  // Restrict index.html to the main entry, then mint a sibling for overlay.html
  // from the same options (template aside) so minify/inject/inline-runtime all
  // match. Same constructor, so the InlineChunkHtmlPlugin hooks both.
  const HtmlWebpackPlugin = mainHtml.constructor;
  const mainHtmlOptions = mainHtml.userOptions || mainHtml.options;

  webpackConfig.plugins.push(
    new HtmlWebpackPlugin({
      ...mainHtmlOptions,
      filename: "overlay.html",
      template: path.resolve(__dirname, "public/overlay.html"),
      chunks: ["overlay"],
    })
  );
  mainHtml.options.chunks = ["main"];
  if (mainHtml.userOptions) mainHtml.userOptions.chunks = ["main"];

  return webpackConfig;
}

// https://www.npmjs.com/package/@craco/craco
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.target = "electron-renderer";
      webpackConfig.module.rules.push({
        test: /\.node$/,
        use: "native-addon-loader",
      });
      webpackConfig.node = { ...webpackConfig.node, fs: "empty" };
      // Force every @supabase/* package onto its CommonJS build. supabase-js v2
      // ships .mjs re-exports that webpack 4 (react-scripts 4) can't analyze
      // ("Attempted import error: createClient is not exported"). See
      // supabaseCjsAlias.js.
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        ...supabaseCjsAlias(),
      };

      return addOverlayEntry(webpackConfig);
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
