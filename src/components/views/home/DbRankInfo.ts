import { CombinedRankInfo } from "../../../background/onLabel/InEventGetCombinedRankInfo";

export default interface DbRankInfo extends CombinedRankInfo {
  uuid: string;
  pubKey: string;
  name: string;
  avatar: string;
  updated: number;
}
