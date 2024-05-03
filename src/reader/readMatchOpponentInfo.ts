// eslint-disable-next-line no-undef
const reader = __non_webpack_require__("mtga-reader");

const { readData } = reader;

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

export default function readMatchOpponentInfo() {
  const opponentInfo: PlayerInfo = readData("MTGA", [
    "PAPA",
    "_instance",
    "_matchManager",
    "<OpponentInfo>k__BackingField",
  ]);

  return opponentInfo;
}
