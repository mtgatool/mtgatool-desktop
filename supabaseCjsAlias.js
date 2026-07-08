const fs = require("fs");
const path = require("path");

/**
 * Build webpack resolve aliases that point every @supabase/* package at its
 * CommonJS `main` build instead of the ESM `module` build.
 *
 * react-scripts 4 runs on webpack 4, whose strict ESM handling chokes on
 * supabase-js v2's `.mjs` re-exports ("Attempted import error:
 * 'PostgrestClient' is not exported ..."). Node's require.resolve() returns
 * each package's CJS entry, and forcing the whole @supabase tree onto CJS
 * sidesteps the ESM named-export analysis entirely.
 */
module.exports = function supabaseCjsAlias() {
  const scopeDir = path.resolve(__dirname, "node_modules", "@supabase");
  const alias = {};

  if (!fs.existsSync(scopeDir)) return alias;

  for (const name of fs.readdirSync(scopeDir)) {
    const pkg = `@supabase/${name}`;
    try {
      // require.resolve honours the "main" (CJS) field, not "module".
      alias[`${pkg}$`] = require.resolve(pkg);
    } catch (_e) {
      // Sub-dependency not directly resolvable; skip it.
    }
  }

  return alias;
};
