import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import {
  DbCardsData,
  DbDisplayName,
  DbInventoryData,
  DbRankData,
  DbUserids,
} from "../types/dbTypes";
import globalData from "../utils/globalData";
import { sanitizeRank } from "../utils/mtga/rankClasses";
import { getData, queryKeys } from "./store";

/**
 * Local-mode session start, replacing the tool-db login + afterLogin flow.
 * Loads everything the account used to pull from the p2p network out of the
 * local IndexedDB store and mirrors it into Redux. There is no identity yet;
 * Supabase auth will replace this.
 */
export default async function localLogin(): Promise<void> {
  const { dispatch } = store;

  reduxAction(dispatch, { type: "SET_PUBKEY", arg: "local" });

  const matches = (await queryKeys("matches-", true)) || [];
  globalData.matchesIndex = matches;
  reduxAction(dispatch, { type: "SET_LOCAL_MATCHES_INDEX", arg: matches });

  const drafts = (await queryKeys("draft-", true)) || [];
  globalData.draftsIndex = drafts;
  reduxAction(dispatch, { type: "SET_DRAFTS_INDEX", arg: drafts });

  const privateMode = await getData<boolean>("privateMode", true);
  reduxAction(dispatch, {
    type: "SET_SETTINGS",
    arg: { privateMode: privateMode === true },
  });

  const hidden = await getData<string[]>("hiddenDecks", true);
  if (hidden) {
    globalData.hiddenDecks = hidden;
    reduxAction(dispatch, { type: "SET_HIDDEN_DECKS", arg: hidden });
  }

  const userids = (await getData<DbUserids>("userids", true)) || {};
  let newest = "";
  let newestDate = 0;

  await Promise.all(
    Object.keys(userids)
      .filter((k) => k && k !== "undefined")
      .map(async (uuid) => {
        if (userids[uuid] > newestDate) {
          newestDate = userids[uuid];
          newest = uuid;
        }

        const [displayName, cards, inventory, rank] = await Promise.all([
          getData<DbDisplayName>(`${uuid}-displayname`, true),
          getData<DbCardsData>(`${uuid}-cards`, true),
          getData<DbInventoryData>(`${uuid}-inventory`, true),
          getData<DbRankData>(`${uuid}-rank`, true),
        ]);

        if (displayName) {
          reduxAction(dispatch, {
            type: "SET_UUID_DISPLAYNAME",
            arg: { displayName: displayName.displayName, uuid },
          });
        }
        if (cards) {
          reduxAction(dispatch, {
            type: "SET_UUID_CARDS_DATA",
            arg: { cards, uuid },
          });
        }
        if (inventory) {
          reduxAction(dispatch, {
            type: "SET_UUID_INVENTORY_DATA",
            arg: { inventory, uuid },
          });
        }
        if (rank) {
          reduxAction(dispatch, {
            type: "SET_UUID_RANK_DATA",
            // Blank out any stored bogus class ("Spark") so it shows as
            // Unranked until a real read corrects it.
            arg: { rank: sanitizeRank(rank), uuid },
          });
        }
      })
  );

  if (newest) {
    reduxAction(dispatch, { type: "SET_UUID", arg: newest });
  }
}
