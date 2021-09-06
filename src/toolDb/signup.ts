import { UserCardsData } from "../types/dbTypes";

export default function signup(username: string, password: string) {
  return new Promise((resolve) => {
    async function doSign() {
      const msg = await window.toolDb.signUp(username, password);
      await window.toolDb.signIn(username, password);
      await window.toolDb.putData<UserCardsData>(
        "cards",
        {
          cards: {},
          prevCards: {},
          updated: 0,
        },
        true
      );
      await window.toolDb.putData("decksIndex", {}, true);
      await window.toolDb.putData("matchesIndex", [], true);

      resolve(msg);
    }
    doSign();
  });
}
