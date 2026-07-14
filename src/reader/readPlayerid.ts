import switchPlayerUUID from "../utils/switchPlayerUUID";
import { ReaderAccount } from "../utils/mtgaReader";

export default function readPlayerId() {
  // eslint-disable-next-line no-undef
  const reader = __non_webpack_require__("mtga-reader");

  // mtga-reader 0.1.6 typed account read: { displayName, personaId, ... }.
  const account: ReaderAccount & { error?: string } = reader.readAccount("MTGA");

  if (!account || account.error) return;

  if (account.personaId && account.displayName) {
    switchPlayerUUID(account.personaId, account.displayName);
  }
}
