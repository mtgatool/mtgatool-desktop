"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const handleDraftsIndex_1 = __importDefault(require("./handleDraftsIndex"));
const handleLiveFeed_1 = __importDefault(require("./handleLiveFeed"));
const handleMatchesIndex_1 = __importDefault(require("./handleMatchesIndex"));
const reduxAction_1 = __importDefault(require("./reduxAction"));
function afterLogin() {
    const currentDay = Math.floor(new Date().getTime() / (86400 * 1000));
    if (self.toolDb.user) {
        // setLocalSetting("pubkey", self.toolDb.user.pubKey);
        self.toolDb
            .queryKeys(`:${self.toolDb.user.pubKey}.matches-`)
            .then(handleMatchesIndex_1.default);
        self.toolDb
            .queryKeys(`:${self.toolDb.user.pubKey}.draft-`)
            .then(handleDraftsIndex_1.default);
    }
    self.toolDb.addKeyListener(`matches-livefeed-${currentDay}`, handleLiveFeed_1.default);
    self.toolDb.getData(`matches-livefeed-${currentDay}`);
    self.toolDb.subscribeData("userids", true);
    self.toolDb.subscribeData(`matches-livefeed-${currentDay}`);
    self.toolDb.getData("hiddenDecks", true, 5000).then((hidden) => {
        if (hidden) {
            self.globalData.hiddenDecks = hidden;
            (0, reduxAction_1.default)("SET_HIDDEN_DECKS", hidden);
        }
    });
    self.toolDb
        .getData("userids", true, 5000)
        .then((data) => {
        let newest = "";
        let newestDate = 0;
        Object.keys(data).forEach((uuid) => {
            if (data[uuid] > newestDate) {
                newestDate = data[uuid];
                newest = uuid;
            }
            self.toolDb.addKeyListener(self.toolDb.getUserNamespacedKey(`${uuid}-cards`), (msg) => {
                if (msg.type === "put") {
                    (0, reduxAction_1.default)("SET_UUID_CARDS_DATA", { cards: msg.v, uuid });
                }
            });
            self.toolDb.subscribeData(`${uuid}-cards`, true);
            self.toolDb.addKeyListener(self.toolDb.getUserNamespacedKey(`${uuid}-inventory`), (msg) => {
                if (msg.type === "put") {
                    (0, reduxAction_1.default)("SET_UUID_INVENTORY_DATA", {
                        inventory: msg.v,
                        uuid,
                    });
                }
            });
            self.toolDb.subscribeData(`${uuid}-inventory`, true);
            self.toolDb.addKeyListener(self.toolDb.getUserNamespacedKey(`${uuid}-rank`), (msg) => {
                if (msg.type === "put") {
                    (0, reduxAction_1.default)("SET_UUID_RANK_DATA", { rank: msg.v, uuid });
                }
            });
            self.toolDb.subscribeData(`${uuid}-rank`, true);
            (0, reduxAction_1.default)("SET_UUID", newest);
        });
    })
        .catch(console.warn);
}
exports.default = afterLogin;
