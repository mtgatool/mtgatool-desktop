import { CombinedRankInfo } from "../../../background/onLabel/InEventGetCombinedRankInfo";

export default interface DbRankInfo extends CombinedRankInfo {
  name: string;
  avatar: string;
}
