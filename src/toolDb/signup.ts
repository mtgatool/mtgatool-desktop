import { UserCardsData } from "../types/dbTypes";

export default function signup(username: string, password: string) {
  return window.toolDb.signUp(username, password).then((msg) => {
    window.toolDb.signIn(username, password).then(() => {
      window.toolDb.putData<UserCardsData>(
        "cards",
        {
          cards: {},
          prevCards: {},
          updated: 0,
        },
        true
      );
      window.toolDb.putData("decksIndex", {}, true);
      window.toolDb.putData("matchesIndex", [], true);

      return msg;
    });
  });
}
