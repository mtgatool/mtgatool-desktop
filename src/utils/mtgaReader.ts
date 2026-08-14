import type {
  ClassDetails,
  ClassInfo,
  DictionaryData,
  InstanceData,
  ReaderAccount,
  ReaderCollection,
  ReaderDecks,
  ReaderDraft,
  ReaderInventory,
  ReaderRanks,
} from "mtga-reader";

/**
 * The typed doorway to mtga-reader.
 *
 * The native addon is loaded with `__non_webpack_require__`, which TypeScript
 * types as `any` — the package's own index.d.ts never enters the picture (and
 * its high-level readers are all `Promise<unknown>` anyway, since NAPI-RS
 * cannot express the JSON payloads the Rust side builds). `getReader()` is the
 * one place that raw require lives, stamped with the real signatures; every
 * reader in `src/reader/*` goes through it.
 *
 * Since mtga-reader 0.1.11 the payload shapes live in the package's own
 * index.d.ts (declared in its Rust source), re-exported here for the cloud
 * sync layer (`src/data/cloudSync.ts`, `upsertDbDecks.ts`) and everyone else.
 */

/**
 * Every reader resolves with its payload on success and `{ error }` when the
 * read cannot be done (wrong scene, process gone, layout drift) — errors are
 * a resolved value, not a rejection.
 */
export type ReaderResponse<T> = T & { error?: string };

// The payload shapes come from the package itself since mtga-reader 0.1.11 —
// declared in its Rust source as emission-only structs, one source of truth
// for both repos. The desktop-era name MemoryDraft is kept as an alias.
export type {
  ReaderAccount,
  ReaderCardCount,
  ReaderCollection,
  ReaderDeck,
  ReaderDeckPile,
  ReaderDecks,
  ReaderDraft,
  ReaderError,
  ReaderInventory,
  ReaderRank,
  ReaderRanks,
  ReaderWildcards,
} from "mtga-reader";

export type MemoryDraft = ReaderDraft;

// The low-level IL2CPP introspection shapes come from the package's own
// index.d.ts — a type-only import is erased at compile time, so the runtime
// still loads through __non_webpack_require__ below. Only the payload shapes
// above and the generic signatures below are ours, because the generated
// declarations cannot carry them (every high-level reader is
// Promise<unknown> there). Caveat inherited with them: InstanceField.value
// and DictionaryEntry key/value are `any` in the generated file — narrowing
// that to `unknown` belongs in the mtga-reader repo, not here.
export type {
  ClassDetails,
  ClassInfo,
  DictionaryData,
  DictionaryEntry,
  FieldInfo,
  InstanceData,
  InstanceField,
  StaticInstanceInfo,
} from "mtga-reader";

/**
 * The native module's real surface, matching the package's index.d.ts —
 * needed at all only because the addon is loaded through
 * `__non_webpack_require__`, which TypeScript cannot resolve to the package.
 * `readData` takes its payload type as a generic: pass the shape of the field
 * path being read, `unknown` otherwise. `any` appears nowhere.
 */
export interface MtgaReader {
  isAdmin(): boolean;
  /** Async: process enumeration runs on the threadpool. */
  findProcess(processName: string): Promise<boolean>;
  /**
   * Async: session init scans the game's loaded assemblies (the expensive,
   * multi-second step) — resolves once cached.
   */
  init(processName: string): Promise<unknown>;
  close(): boolean;
  isInitialized(): boolean;
  getAssemblies(): string[];
  getAssemblyClasses(assemblyName: string): ClassInfo[];
  getClassDetails(assemblyName: string, className: string): ClassDetails;
  getInstance(address: number): InstanceData;
  getInstanceField(address: number, fieldName: string): unknown;
  getStaticField(classAddress: number, fieldName: string): unknown;
  getDictionary(address: number): DictionaryData;
  /** Walk a static field path and return whatever object lives at its end. */
  readData<T = unknown>(
    processName: string,
    fields: string[]
  ): Promise<ReaderResponse<T>>;
  readClass<T = unknown>(
    processName: string,
    address: number
  ): Promise<ReaderResponse<T>>;
  readGenericInstance<T = unknown>(
    processName: string,
    address: number
  ): Promise<ReaderResponse<T>>;
  /**
   * Read all saved decks (name, deckId, format/attributes, per-pile card
   * lists). Home screen only — returns an error object during a match.
   */
  readDecks(processName: string): Promise<ReaderResponse<ReaderDecks>>;
  /**
   * Read the active draft: event name, draft position, the pack on offer and
   * the picks so far, in pick order. Works mid-draft; returns an error object
   * when no draft is running.
   */
  readDraft(processName: string): Promise<ReaderResponse<ReaderDraft>>;
  /** Read the player's constructed + limited rank info. */
  readRanks(processName: string): Promise<ReaderResponse<ReaderRanks>>;
  /** Read the player's account identity (displayName, personaId, ...). */
  readAccount(processName: string): Promise<ReaderResponse<ReaderAccount>>;
  /** Read the player's owned-card collection (grpId -> quantity). */
  readCollection(
    processName: string
  ): Promise<ReaderResponse<ReaderCollection>>;
  /** Read the player's wallet/inventory (gems, gold, wildcards, vault, ...). */
  readInventory(processName: string): Promise<ReaderResponse<ReaderInventory>>;
}

/**
 * Load the native addon, typed. Electron only — the bare require throws in a
 * plain browser bundle, so callers keep their isElectron() gates.
 */
export function getReader(): MtgaReader {
  // eslint-disable-next-line no-undef
  return __non_webpack_require__("mtga-reader") as MtgaReader;
}
