import isTauri from "../utils/tauri/isTauri";

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

export default function readPlayerTest() {
  // In Tauri, native modules aren't available in the browser context
  if (isTauri()) {
    // TODO: Implement via Tauri command
    return null;
  }

  try {
    // eslint-disable-next-line no-undef
    const reader = __non_webpack_require__("mtga-reader");

    const { readData } = reader;

    const data = readData("MTGA", [
      "WrapperController",
      "<Instance>k__BackingField",
      "<AccountClient>k__BackingField",
      "<AccountInformation>k__BackingField",
    ]);

    if (data.error) return null;

    const accountInformation: AccountInformation = data;

    if (accountInformation && accountInformation.DisplayName) {
      return accountInformation.DisplayName;
    }

    return null;
  } catch (error) {
    console.error("Failed to access mtga-reader:", error);
    return null;
  }
}
