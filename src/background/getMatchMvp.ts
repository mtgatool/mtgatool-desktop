/**
 * Pick the card that decided a match.
 *
 * This runs once, when the match is saved, and only its answer is stored. It
 * cannot run later: the overview window receives the match through
 * localStorage and `showPostMatchOverview` strips the action log on the way
 * (it is by far the largest field), and the action log is the only place that
 * records *what a damage event hit*.
 *
 * That distinction is the whole point. `postStats.damage` sums every damage
 * event a card ever caused, to anything — so Ancient Tomb pinging its own
 * controller for 2 a turn accumulated exactly like a creature hitting the
 * opponent's face, and the old pick (the max of that, across both players,
 * regardless of who won) surfaced lands and dead-end beaters as the MVP.
 */
import { ActionLogV2 } from "../components/action-log-v2/types";
import { CardCast, MatchGameStats } from "../types/currentMatch";
import database from "../utils/mtga/database";

export interface MatchMvp {
  grpId: number;
  /** Which measure won it the spot; the overview writes the subtitle from it. */
  reason: "damage" | "casts" | "board";
  /** The figure behind `reason`, for that subtitle. */
  value: number;
  /** Whose card it was. */
  seat: number;
}

interface Score {
  grpId: number;
  seat: number;
  damage: number;
  casts: number;
  board: number;
  total: number;
}

/**
 * Weights. Damage to the opposing player is what actually ends a game, so it
 * leads; the other two exist to give a sensible answer when a game was won
 * without much of it — a combo, a mill, a concede against a big board.
 */
const DAMAGE_WEIGHT = 10;
const CAST_WEIGHT = 6;
const BOARD_WEIGHT = 2;
/**
 * Lands are discounted rather than excluded: Ancient Tomb's damage already
 * scores zero (it hits its own controller), but a creature-land that really
 * did the work should still be able to win, just not from mana alone.
 */
const LAND_FACTOR = 0.15;

/**
 * How much a resolved permanent is worth just for being on the battlefield.
 * Cost and power stand in for "biggest thing that landed" — the GRE tells us
 * what was cast, not what was scariest.
 */
function boardValue(grpId: number): number {
  const card = database.card(grpId);
  if (!card) return 0;
  const types = card.Types || "";
  // Only permanents stick around to win a game by presence.
  if (!/Creature|Planeswalker|Artifact|Enchantment/.test(types)) return 0;
  const power = parseInt(card.Power || "0", 10);
  return (card.Cmc || 0) + (Number.isNaN(power) ? 0 : power);
}

function isLand(grpId: number): boolean {
  const card = database.card(grpId);
  return !!card && (card.Types || "").includes("Land");
}

/**
 * Damage each card dealt to the player on the other side of the table.
 *
 * Damage to one's own player scores nothing (that is the painland case) and
 * neither does damage to permanents: killing three tokens is board control,
 * not a win condition, and it used to headline matches.
 */
function damageToOpponents(log: ActionLogV2 | undefined): Map<string, number> {
  const out = new Map<string, number>();
  (log?.lines || []).forEach((line) => {
    if (line.type !== "DAMAGE_DEALT") return;
    if (line.targetType !== "PLAYER") return;
    // targetId is the seat for a player hit; a card damaging its own
    // controller is the thing we are trying to stop rewarding.
    if (line.targetId === line.seat) return;
    if (!line.sourceGrpId) return;
    const key = `${line.seat}:${line.sourceGrpId}`;
    out.set(key, (out.get(key) || 0) + (line.amount || 0));
  });
  return out;
}

/**
 * The MVP, preferring the winner's side.
 *
 * `winnerSeat` is the match winner. The loser is only considered when nothing
 * on the winning side scored at all — winning by decking, or on a concede
 * before doing anything, leaves the winner with no card worth naming.
 */
export default function getMatchMvp(
  gameStats: MatchGameStats[],
  actionLog: ActionLogV2 | undefined,
  winnerSeat: number
): MatchMvp | undefined {
  const casts: CardCast[] = (gameStats || []).flatMap(
    (g) => g?.cardsCast || []
  );
  const damage = damageToOpponents(actionLog);

  const scores = new Map<string, Score>();
  const at = (seat: number, grpId: number): Score => {
    const key = `${seat}:${grpId}`;
    let s = scores.get(key);
    if (!s) {
      s = { grpId, seat, damage: 0, casts: 0, board: 0, total: 0 };
      scores.set(key, s);
    }
    return s;
  };

  damage.forEach((amount, key) => {
    const [seat, grpId] = key.split(":").map(Number);
    at(seat, grpId).damage += amount;
  });

  casts.forEach((cast) => {
    if (!cast?.grpId) return;
    const s = at(cast.player, cast.grpId);
    s.casts += 1;
    // Counted once however many times it was cast: this is "it was on the
    // battlefield", not "it was cast a lot", which `casts` already carries.
    if (s.board === 0) s.board = boardValue(cast.grpId);
  });

  const ranked = [...scores.values()]
    .map((s) => {
      const raw =
        s.damage * DAMAGE_WEIGHT +
        // The first cast is not evidence of anything; repeats are.
        Math.max(0, s.casts - 1) * CAST_WEIGHT +
        s.board * BOARD_WEIGHT;
      return { ...s, total: isLand(s.grpId) ? raw * LAND_FACTOR : raw };
    })
    .filter((s) => s.total > 0)
    .sort((a, b) => b.total - a.total || b.damage - a.damage);

  const winners = ranked.filter((s) => s.seat === winnerSeat);
  const best = winners[0] || ranked[0];
  if (!best) return undefined;

  // The subtitle should say the thing that earned it the spot, not always
  // "damage dealt" — an odd-looking pick with the wrong caption reads as a
  // bug, and the same pick with the right one reads as a fact.
  let reason: MatchMvp["reason"] = "board";
  let value = best.board;
  if (best.damage > 0) {
    reason = "damage";
    value = best.damage;
  } else if (best.casts > 1) {
    reason = "casts";
    value = best.casts;
  }

  return { grpId: best.grpId, reason, value, seat: best.seat };
}
