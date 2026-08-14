import { getReader } from "../utils/mtgaReader";

// A light "can we read player memory" probe used by ReaderStatus. Async on the
// native threadpool (never blocks the event loop).
export default async function readPlayerTest(): Promise<string | null> {
  try {
    const account = await getReader().readAccount("MTGA");

    if (!account || account.error) return null;

    return account.displayName || null;
  } catch (e) {
    console.error("readPlayerTest failed:", e);
    return null;
  }
}
