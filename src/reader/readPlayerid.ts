import { isMemoryReadingAvailable, readAccount } from "../utils/mtgaReader";
import switchPlayerUUID from "../utils/switchPlayerUUID";

export default async function readPlayerId() {
  // Skip if memory reading is not available (web mode)
  if (!isMemoryReadingAvailable()) return;

  try {
    const account = await readAccount("MTGA");

    if (account && account.personaId && account.displayName) {
      switchPlayerUUID(account.personaId, account.displayName);
    }
  } catch (error) {
    console.error("Failed to read player ID:", error);
  }
}
