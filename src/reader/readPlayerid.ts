import { getReader } from "../utils/mtgaReader";
import switchPlayerUUID from "../utils/switchPlayerUUID";

export default async function readPlayerId(): Promise<void> {
  try {
    const account = await getReader().readAccount("MTGA");

    if (!account || account.error) return;

    if (account.personaId && account.displayName) {
      switchPlayerUUID(account.personaId, account.displayName);
    }
  } catch (e) {
    console.error("readPlayerId failed:", e);
  }
}
