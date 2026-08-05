/**
 * The official SQLite wasm glue is copied into public/cards-db-worker/ at build
 * time (scripts/build-cards-db-worker.js), so there is nothing for TypeScript
 * to resolve `./sqlite3.mjs` to at type-check time. The surface is deliberately
 * loose — the worker touches only `oo1.DB`, `capi.sqlite3_deserialize` and
 * `wasm.allocFromTypedArray`.
 */
declare module "*.mjs" {
  interface Sqlite3InitOptions {
    wasmBinary?: ArrayBuffer;
    locateFile?: (file: string) => string;
    print?: (...args: unknown[]) => void;
    printErr?: (...args: unknown[]) => void;
  }

  const sqlite3InitModule: (options?: Sqlite3InitOptions) => Promise<any>;
  export default sqlite3InitModule;
}
