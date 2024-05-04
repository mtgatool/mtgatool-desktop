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

export default function readMatchOpponentInfo(): PlayerInfo | undefined {
  // eslint-disable-next-line no-undef
  const reader = __non_webpack_require__("mtga-reader");

  const { readData } = reader;

  const opponentInfo = readData("MTGA", [
    "PAPA",
    "_instance",
    "_matchManager",
    "<OpponentInfo>k__BackingField",
  ]);

  if (opponentInfo.error) return undefined;

  return opponentInfo;
}
