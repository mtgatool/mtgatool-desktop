import { isMemoryReadingAvailable, readData } from "../utils/mtgaReader";
import switchPlayerUUID from "../utils/switchPlayerUUID";

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

export default async function readPlayerId() {
  // Skip if memory reading is not available (web mode)
  if (!isMemoryReadingAvailable()) return;

  try {
    const data = await readData("MTGA", [
      "WrapperController",
      "<Instance>k__BackingField",
      "<AccountClient>k__BackingField",
      "<AccountInformation>k__BackingField",
    ]);

    if (!data || data.error) return;

    const accountInformation: AccountInformation = data;

    if (
      accountInformation &&
      accountInformation.PersonaID &&
      accountInformation.DisplayName
    ) {
      switchPlayerUUID(
        accountInformation.PersonaID,
        accountInformation.DisplayName
      );
    }
  } catch (error) {
    console.error("Failed to read player ID:", error);
  }
}
