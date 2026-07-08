import { pushDebug } from "../utils/debugLog";
import { isMemoryReadingAvailable, readAccount } from "../utils/mtgaReader";
import switchPlayerUUID from "../utils/switchPlayerUUID";

export default async function readPlayerId() {
  // Skip if memory reading is not available (web mode)
  if (!isMemoryReadingAvailable()) return;

  try {
    const account = await readAccount("MTGA");

    if (account && account.personaId && account.displayName) {
      pushDebug(`readPlayerId: ${account.displayName} (${account.personaId})`);
      switchPlayerUUID(account.personaId, account.displayName);
    } else {
      pushDebug(
        `readPlayerId: EMPTY account (${JSON.stringify(
          account
        )}) — not elevated or MTGA not logged in?`
      );
    }
  } catch (error) {
    pushDebug(`readPlayerId FAILED: ${String(error)}`);
  }
}
