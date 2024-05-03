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

export default function readMatchPlayerInfo() {
  const playerInfo: PlayerInfo = readData("MTGA", [
    "PAPA",
    "_instance",
    "_matchManager",
    "<LocalPlayerInfo>k__BackingField",
  ]);

  return playerInfo;
}
