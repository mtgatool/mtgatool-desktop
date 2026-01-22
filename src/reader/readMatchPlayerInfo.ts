import { isMemoryReadingAvailable, readData } from "../utils/mtgaReader";

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

export default async function readMatchPlayerInfo(): Promise<
  PlayerInfo | undefined
> {
  // Skip if memory reading is not available (web mode)
  if (!isMemoryReadingAvailable()) return undefined;

  const playerInfo = await readData("MTGA", [
    "PAPA",
    "_instance",
    "_matchManager",
    "<LocalPlayerInfo>k__BackingField",
  ]);

  if (!playerInfo || playerInfo.error) return undefined;

  return playerInfo;
}
