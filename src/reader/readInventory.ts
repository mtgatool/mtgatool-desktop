import upsertDbInventory from "../data/upsertDbInventory";
import {
  isMemoryReadingAvailable,
  readInventory as readInventoryMemory,
} from "../utils/mtgaReader";

/**
 * Read the wallet/inventory (gems, gold, wildcards, vault) from MTGA memory
 * and persist it. Inventory is no longer emitted to the Arena log, so memory
 * is the only source (see docs/LOG_FORMAT.md).
 */
export default async function readInventory() {
  if (!isMemoryReadingAvailable()) return;

  const inv = await readInventoryMemory("MTGA");
  if (!inv) return;

  upsertDbInventory({
    Gems: inv.gems ?? 0,
    Gold: inv.gold ?? 0,
    TotalVaultProgress: inv.vaultProgress ?? 0,
    wcTrackPosition: inv.wcTrackPosition ?? 0,
    WildCardCommons: inv.wildcards?.common ?? 0,
    WildCardUnCommons: inv.wildcards?.uncommon ?? 0,
    WildCardRares: inv.wildcards?.rare ?? 0,
    WildCardMythics: inv.wildcards?.mythic ?? 0,
  });
}
