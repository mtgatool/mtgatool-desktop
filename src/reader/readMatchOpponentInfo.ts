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

export default async function readMatchOpponentInfo(): Promise<
  PlayerInfo | undefined
> {
  try {
    const opponentInfo = await getReader().readData<PlayerInfo>("MTGA", [
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
