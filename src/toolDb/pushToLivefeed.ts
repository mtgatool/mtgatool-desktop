import { DbMatch } from "../types/dbTypes";

export default async function pushToLiveFeed(match: DbMatch) {
  return window.toolDb.putData<DbMatch>("matches-livefeed", match);
}
