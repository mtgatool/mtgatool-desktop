/* eslint-disable no-restricted-globals */
import {
  DbCardsData,
  DbDisplayName,
  DbInventoryData,
  DbRankData,
} from "./dbTypes";
import handleDraftsIndex from "./handleDraftsIndex";
import handleLiveFeed from "./handleLiveFeed";
import handleMatchesIndex from "./handleMatchesIndex";
import reduxAction from "./reduxAction";

export default function afterLogin() {
  const currentDay = Math.floor(new Date().getTime() / (86400 * 1000));

  if (self.toolDb.user) {
    reduxAction("SET_PUBKEY", self.toolDb.user.pubKey);
    self.toolDb
      .queryKeys(`:${self.toolDb.user.pubKey}.matches-`)
      .then(handleMatchesIndex);

    self.toolDb.store
      .query(`:${self.toolDb.user.pubKey}.matches-`)
      .then((matches) => {
        reduxAction("SET_LOCAL_MATCHES_INDEX", matches);
      });

    self.toolDb
      .queryKeys(`:${self.toolDb.user.pubKey}.draft-`)
      .then(handleDraftsIndex);

    self.toolDb.getData(`privateMode`, true).then((settingPrivate) => {
      reduxAction("SET_SETTINGS", { privateMode: settingPrivate === true });
    });
  }

  self.toolDb.addKeyListener(`matches-livefeed-${currentDay}`, handleLiveFeed);
  self.toolDb.getData(`matches-livefeed-${currentDay}`);

  self.toolDb.subscribeData("userids", true);
  self.toolDb.subscribeData(`matches-livefeed-${currentDay}`);

  self.toolDb.getData<string[]>("hiddenDecks", true, 5000).then((hidden) => {
    if (hidden) {
      self.globalData.hiddenDecks = hidden;
      reduxAction("SET_HIDDEN_DECKS", hidden);
    }
  });

  self.toolDb
    .getData("userids", true, 5000)
    .then((data) => {
      let newest = "";
      let newestDate = 0;
      Object.keys(data)
        .filter((k) => k && k !== "undefined")
        .forEach((uuid) => {
          if (data[uuid] > newestDate) {
            newestDate = data[uuid];
            newest = uuid;
          }

          self.toolDb.addKeyListener<DbDisplayName>(
            self.toolDb.getUserNamespacedKey(`${uuid}-displayname`),
            (msg) => {
              if (msg.type === "put") {
                reduxAction("SET_UUID_DISPLAYNAME", {
                  displayName: msg.v.displayName,
                  uuid,
                });
              }
            }
          );
          self.toolDb.subscribeData(`${uuid}-displayname`, true);

          self.toolDb.addKeyListener<DbCardsData>(
            self.toolDb.getUserNamespacedKey(`${uuid}-cards`),
            (msg) => {
              if (msg.type === "put") {
                reduxAction("SET_UUID_CARDS_DATA", { cards: msg.v, uuid });
              }
            }
          );
          self.toolDb.subscribeData(`${uuid}-cards`, true);

          self.toolDb.addKeyListener<DbInventoryData>(
            self.toolDb.getUserNamespacedKey(`${uuid}-inventory`),
            (msg) => {
              if (msg.type === "put") {
                reduxAction("SET_UUID_INVENTORY_DATA", {
                  inventory: msg.v,
                  uuid,
                });
              }
            }
          );
          self.toolDb.subscribeData(`${uuid}-inventory`, true);

          self.toolDb.addKeyListener<DbRankData>(
            self.toolDb.getUserNamespacedKey(`${uuid}-rank`),
            (msg) => {
              if (msg.type === "put") {
                reduxAction("SET_UUID_RANK_DATA", { rank: msg.v, uuid });
              }
            }
          );
          self.toolDb.subscribeData(`${uuid}-rank`, true);

          self.globalData.currentUUID = newest;
          reduxAction("SET_UUID", newest);
        });
    })
    .catch(console.warn);
}
