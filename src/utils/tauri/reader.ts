import { invoke } from "@tauri-apps/api/tauri";

/**
 * Check if the current process has admin/elevated privileges
 */
export async function isAdmin(): Promise<boolean> {
  return invoke<boolean>("is_admin");
}

/**
 * Find a process by name
 */
export async function findProcess(processName: string): Promise<boolean> {
  return invoke<boolean>("find_process", { processName });
}

/**
 * Read data from process memory following a field path
 */
export async function readData(
  processName: string,
  fields: string[]
): Promise<any> {
  return invoke<any>("read_data", { processName, fields });
}

/**
 * Read a class instance at a specific address
 */
export async function readClass(
  processName: string,
  address: number
): Promise<any> {
  return invoke<any>("read_class", { processName, address });
}

/**
 * Read a generic instance at a specific address
 */
export async function readGenericInstance(
  processName: string,
  address: number
): Promise<any> {
  return invoke<any>("read_generic_instance", { processName, address });
}

/**
 * Initialize a cached reader session. Scans assemblies once so subsequent
 * typed reads take ~10-20ms instead of a full ~4s scan.
 */
export async function readerInit(processName: string): Promise<boolean> {
  return invoke<boolean>("reader_init", { processName });
}

/**
 * Clear the cached reader session
 */
export async function readerClose(): Promise<boolean> {
  return invoke<boolean>("reader_close");
}

/**
 * Whether a cached reader session is active
 */
export async function readerIsInitialized(): Promise<boolean> {
  return invoke<boolean>("reader_is_initialized");
}

/**
 * Read all saved decks (name, deckId, attributes, per-pile card lists)
 */
export async function readDecks(processName: string): Promise<any> {
  return invoke<any>("read_decks", { processName });
}

/**
 * Read constructed/limited rank info
 */
export async function readRanks(processName: string): Promise<any> {
  return invoke<any>("read_ranks", { processName });
}

/**
 * Read account identity (displayName, personaId, ...)
 */
export async function readAccount(processName: string): Promise<any> {
  return invoke<any>("read_account", { processName });
}

/**
 * Read the card collection as {count, cards: [{grpId, qty}]}
 */
export async function readCollection(processName: string): Promise<any> {
  return invoke<any>("read_collection", { processName });
}

/**
 * Read inventory (gems, gold, wildcards, vault progress, ...)
 */
export async function readInventory(processName: string): Promise<any> {
  return invoke<any>("read_inventory", { processName });
}
