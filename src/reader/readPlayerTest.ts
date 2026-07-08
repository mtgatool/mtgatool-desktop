import { isMemoryReadingAvailable, readAccount } from "../utils/mtgaReader";

export default async function readPlayerTest(): Promise<string | null> {
  // Skip if memory reading is not available (web mode)
  if (!isMemoryReadingAvailable()) return null;

  try {
    const account = await readAccount("MTGA");

    if (account && account.displayName) {
      return account.displayName;
    }

    return null;
  } catch (error) {
    console.error("Failed to read player test:", error);
    return null;
  }
}
