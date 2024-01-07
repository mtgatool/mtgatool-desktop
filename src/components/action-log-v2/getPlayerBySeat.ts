import getPlayerNameWithoutSuffix from "../../utils/getPlayerNameWithoutSuffix";
import { ActionLogPlayer } from "./types";

export default function getPlayerBySeat(
  seat: number,
  players: ActionLogPlayer[]
): string {
  const playerName =
    players.filter((player) => player.seat === seat)[0]?.name || "";
  return getPlayerNameWithoutSuffix(playerName);
}
