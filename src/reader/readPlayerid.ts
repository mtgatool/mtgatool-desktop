import switchPlayerUUID from "../utils/switchPlayerUUID";

// eslint-disable-next-line no-undef
const reader = __non_webpack_require__("mtga-reader");

const { readData } = reader;

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

export default function readPlayerId() {
  const data = readData("MTGA", [
    "WrapperController",
    "<Instance>k__BackingField",
    "<AccountClient>k__BackingField",
    "<AccountInformation>k__BackingField",
  ]);

  if (data.error) return;

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
}
