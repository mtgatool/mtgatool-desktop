import getPlayerNameWithoutSuffix from "../utils/getPlayerNameWithoutSuffix";
import globalStore from "./store";

// Get player name by seat in the game
const getNameBySeat = (seat: number): string => {
  const { currentMatch } = globalStore;
  try {
    if (seat === currentMatch.playerSeat) {
      return getPlayerNameWithoutSuffix(
        currentMatch.player.name || "???#00000"
      );
    }

    const oppName = currentMatch.opponent.name;
    if (!oppName) {
      return "Opponent";
    }
    if (oppName === "Sparky") {
      return oppName;
    }

    return getPlayerNameWithoutSuffix(oppName);
  } catch (e) {
    return "???";
  }
};

export default getNameBySeat;
