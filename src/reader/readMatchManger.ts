import { isMemoryReadingAvailable, readData } from "../utils/mtgaReader";

interface MatchManager {
  "<BattlefieldId>k__BackingField": string;
  "<CurrentGameNumber>k__BackingField": number;
  "<FabricUri>k__BackingField": string;
  "<Format>k__BackingField": number;
  "<IsPracticeGame>k__BackingField": boolean;
  "<IsPrivateGame>k__BackingField": boolean;
  "<LocalPlayerSeatId>k__BackingField": number;
  "<MatchID>k__BackingField": string;
  "<MatchState>k__BackingField": number;
  "<PrivateGameWaitingForMatchMade>k__BackingField": boolean;
  "<Variant>k__BackingField": number;
  "<WinCondition>k__BackingField": number;
  HasReconnected: boolean;
  disposed: boolean;
}

export default async function readMatchManger(): Promise<
  MatchManager | undefined
> {
  // Skip if memory reading is not available (web mode)
  if (!isMemoryReadingAvailable()) return undefined;

  const matchManager = await readData("MTGA", [
    "PAPA",
    "_instance",
    "_matchManager",
  ]);

  if (!matchManager || matchManager.error) return undefined;

  return matchManager;
}
