import { CombinedRankInfo } from "../../../background/onLabel/InEventGetCombinedRankInfo";

export default interface DbRankInfo extends CombinedRankInfo {
  uuid: string;
  name: string;
  avatar: string;
  updated: number;
}
