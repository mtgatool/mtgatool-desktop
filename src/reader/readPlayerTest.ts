import { ReaderAccount } from "../utils/mtgaReader";

// A light "can we read player memory" probe used by ReaderStatus. Async on the
// native threadpool since mtga-reader 0.1.7 (never blocks the event loop).
export default async function readPlayerTest(): Promise<string | null> {
  try {
    // eslint-disable-next-line no-undef
    const reader = __non_webpack_require__("mtga-reader");

    const account: ReaderAccount & { error?: string } =
      await reader.readAccount("MTGA");

    if (!account || account.error) return null;

    return account.displayName || null;
  } catch (e) {
    console.error("readPlayerTest failed:", e);
    return null;
  }
}
