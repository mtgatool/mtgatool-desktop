import globalData from "../utils/globalData";
import switchPlayerUUID from "../utils/switchPlayerUUID";

export default function fetchPlayerId(): string | undefined {
  const reader = globalData.mtgaReader;

  const accountInfo = reader.read("mtgaAccountId");

  if (
    accountInfo &&
    accountInfo.personaId !== "undefined" &&
    accountInfo.personaId !== "" &&
    accountInfo.personaId
  ) {
    switchPlayerUUID(accountInfo.personaId, accountInfo.displayName);
    return accountInfo.personaId;
  }

  return undefined;
}
