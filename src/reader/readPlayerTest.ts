import { ReaderAccount } from "../utils/mtgaReader";

// A light "can we read player memory" probe used by ReaderStatus. mtga-reader
// 0.1.6 exposes the typed readAccount ({ displayName, personaId, ... }); the old
// generic readData account path used stale field names.
export default function readPlayerTest() {
  // eslint-disable-next-line no-undef
  const reader = __non_webpack_require__("mtga-reader");

  const account: ReaderAccount & { error?: string } = reader.readAccount("MTGA");

  if (!account || account.error) return null;

  return account.displayName || null;
}
