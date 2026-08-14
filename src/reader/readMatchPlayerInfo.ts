import { getReader } from "../utils/mtgaReader";

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
  try {
    const playerInfo = await getReader().readData<PlayerInfo>("MTGA", [
      "MatchSceneManager",
      "Instance",
      "_matchManager",
      "<LocalPlayerInfo>k__BackingField",
    ]);

    if (!playerInfo || playerInfo.error) return undefined;

    return playerInfo;
  } catch (e) {
    console.error("readMatchPlayerInfo failed:", e);
    return undefined;
  }
}
