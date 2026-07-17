import { ReaderAccount } from "../utils/mtgaReader";
import switchPlayerUUID from "../utils/switchPlayerUUID";

export default async function readPlayerId(): Promise<void> {
  try {
    // eslint-disable-next-line no-undef
    const reader = __non_webpack_require__("mtga-reader");

    // mtga-reader 0.1.7 async typed account read: { displayName, personaId, ... }.
    const account: ReaderAccount & { error?: string } =
      await reader.readAccount("MTGA");

    if (!account || account.error) return;

    if (account.personaId && account.displayName) {
      switchPlayerUUID(account.personaId, account.displayName);
    }
  } catch (e) {
    console.error("readPlayerId failed:", e);
  }
}
