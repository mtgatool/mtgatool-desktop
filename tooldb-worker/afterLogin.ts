import { DbCardsData, DbInventoryData, DbRankData } from "./dbTypes";
import handleDraftsIndex from "./handleDraftsIndex";
import handleLiveFeed from "./handleLiveFeed";
import handleMatchesIndex from "./handleMatchesIndex";
import reduxAction from "./reduxAction";

export default function afterLogin() {
  const currentDay = Math.floor(new Date().getTime() / (86400 * 1000));

  if (window.toolDb.user) {
    // setLocalSetting("pubkey", window.toolDb.user.pubKey);
    window.toolDb
      .queryKeys(`:${window.toolDb.user.pubKey}.matches-`)
      .then(handleMatchesIndex);

    window.toolDb
      .queryKeys(`:${window.toolDb.user.pubKey}.draft-`)
      .then(handleDraftsIndex);
  }

  window.toolDb.addKeyListener(
    `matches-livefeed-${currentDay}`,
    handleLiveFeed
  );

  window.toolDb.subscribeData("userids", true);
  window.toolDb.subscribeData(`matches-livefeed-${currentDay}`);

  window.toolDb.getData<string[]>("hiddenDecks", true, 5000).then((hidden) => {
    if (hidden) {
      window.globalData.hiddenDecks = hidden;
      reduxAction("SET_HIDDEN_DECKS", hidden);
    }
  });

  window.toolDb
    .getData("userids", true, 5000)
    .then((data) => {
      let newest = "";
      let newestDate = 0;
      Object.keys(data).forEach((uuid) => {
        if (data[uuid] > newestDate) {
          newestDate = data[uuid];
          newest = uuid;
        }

        window.toolDb.addKeyListener<DbCardsData>(
          window.toolDb.getUserNamespacedKey(`${uuid}-cards`),
          (msg) => {
            if (msg.type === "put") {
              reduxAction("SET_UUID_CARDS_DATA", { cards: msg.v, uuid });
            }
          }
        );
        window.toolDb.subscribeData(`${uuid}-cards`, true);

        window.toolDb.addKeyListener<DbInventoryData>(
          window.toolDb.getUserNamespacedKey(`${uuid}-inventory`),
          (msg) => {
            if (msg.type === "put") {
              reduxAction("SET_UUID_INVENTORY_DATA", {
                inventory: msg.v,
                uuid,
              });
            }
          }
        );
        window.toolDb.subscribeData(`${uuid}-inventory`, true);

        window.toolDb.addKeyListener<DbRankData>(
          window.toolDb.getUserNamespacedKey(`${uuid}-rank`),
          (msg) => {
            if (msg.type === "put") {
              reduxAction("SET_UUID_RANK_DATA", { rank: msg.v, uuid });
            }
          }
        );
        window.toolDb.subscribeData(`${uuid}-rank`, true);

        reduxAction("SET_UUID", newest);
      });
    })
    .catch(console.warn);
}
