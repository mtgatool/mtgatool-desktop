import { isMemoryReadingAvailable, readData } from "../utils/mtgaReader";

interface AccountInformation {
  AccessToken: string;
  AccountID: string;
  Credentials: null;
  CredentialsState: number;
  DisplayName: string;
  Email: string;
  Expiration: number;
  ExternalID: string;
  GameID: string;
  LinkedAccounts: null;
  Password: string;
  PersonaID: string;
  Roles: null;
}

export default async function readPlayerTest(): Promise<string | null> {
  // Skip if memory reading is not available (web mode)
  if (!isMemoryReadingAvailable()) return null;

  try {
    const data = await readData("MTGA", [
      "WrapperController",
      "<Instance>k__BackingField",
      "<AccountClient>k__BackingField",
      "<AccountInformation>k__BackingField",
    ]);

    if (!data || data.error) return null;

    const accountInformation: AccountInformation = data;

    if (accountInformation && accountInformation.DisplayName) {
      return accountInformation.DisplayName;
    }

    return null;
  } catch (error) {
    console.error("Failed to read player test:", error);
    return null;
  }
}
