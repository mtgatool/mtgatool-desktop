import timed from "./readerTelemetry";

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
  try {
    // eslint-disable-next-line no-undef
    const reader = __non_webpack_require__("mtga-reader");

    const { readData } = reader;

    // 2026 layout: the match manager lives under the MatchSceneManager singleton
    // (WrapperController is unloaded during a match). "PAPA"/"_instance" were the
    // old obfuscated names; the fields below (_matchManager, <LocalPlayerInfo>,
    // <OpponentInfo>, <MatchID>) are unchanged.
    const matchManager = await timed<any>("readMatchManager", () =>
      readData("MTGA", ["MatchSceneManager", "Instance", "_matchManager"])
    );

    if (!matchManager || matchManager.error) return undefined;

    return matchManager;
  } catch (e) {
    console.error("readMatchManger failed:", e);
    return undefined;
  }
}
