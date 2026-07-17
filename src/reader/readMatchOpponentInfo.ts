interface PlayerInfo {
  AvatarSelection: string;
  CommanderGrpId: number;
  IsWotc: false;
  MythicPercentile: number;
  MythicPlacement: number;
  RankingClass: number;
  RankingTier: number;
  SleeveSelection: string;
  WizardsAccountIdForPrivateGaming: string;
  _screenName: string;
}

export default async function readMatchOpponentInfo(): Promise<
  PlayerInfo | undefined
> {
  try {
    // eslint-disable-next-line no-undef
    const reader = __non_webpack_require__("mtga-reader");

    const { readData } = reader;

    const opponentInfo = await readData("MTGA", [
      "MatchSceneManager",
      "Instance",
      "_matchManager",
      "<OpponentInfo>k__BackingField",
    ]);

    if (!opponentInfo || opponentInfo.error) return undefined;

    return opponentInfo;
  } catch (e) {
    console.error("readMatchOpponentInfo failed:", e);
    return undefined;
  }
}
