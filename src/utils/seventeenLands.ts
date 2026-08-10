import postChannelMessage from "../broadcastChannel/postChannelMessage";
import { DraftRatings } from "../types/draft";
import isElectron from "./electron/isElectron";
import getSetInEventId from "./getSetInEventId";

// One fetch per set+queue per session; every draft in the same queue reuses it.
const cache: Record<string, DraftRatings | null> = {};
const pending: Record<string, boolean> = {};

function eventTypeFor(eventId: string): string {
  if (eventId.indexOf("QuickDraft") !== -1) return "QuickDraft";
  if (eventId.indexOf("TradDraft") !== -1) return "TradDraft";
  return "PremierDraft";
}

/** GIH WR z-scores bucketed the way 17lands presents grades. */
function gradeFor(z: number): string {
  if (z >= 2.0) return "A+";
  if (z >= 1.67) return "A";
  if (z >= 1.33) return "A-";
  if (z >= 1.0) return "B+";
  if (z >= 0.67) return "B";
  if (z >= 0.33) return "B-";
  if (z >= 0) return "C+";
  if (z >= -0.33) return "C";
  if (z >= -0.67) return "C-";
  if (z >= -1.0) return "D+";
  if (z >= -1.33) return "D";
  if (z >= -1.67) return "D-";
  return "F";
}

// Field names are 17lands' own.
/* eslint-disable camelcase */
interface SeventeenLandsCard {
  mtga_id: number;
  ever_drawn_win_rate: number | null;
  avg_seen: number | null;
}
/* eslint-enable camelcase */

function httpsGetJson(url: string): Promise<any> {
  // The renderer can't fetch() this — 17lands sends no CORS headers — but with
  // nodeIntegration Node's https is CORS-free.
  // eslint-disable-next-line no-undef
  const https = __non_webpack_require__("https");
  return new Promise((resolve, reject) => {
    https
      .get(url, (res: any) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`17lands responded ${res.statusCode}`));
          return;
        }
        let body = "";
        res.on("data", (chunk: string) => {
          body += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

function toRatings(cards: SeventeenLandsCard[]): DraftRatings {
  const rated = cards.filter(
    (c) => c.mtga_id && typeof c.ever_drawn_win_rate === "number"
  );
  const rates = rated.map((c) => c.ever_drawn_win_rate as number);
  const mean = rates.reduce((a, b) => a + b, 0) / (rates.length || 1);
  const std =
    Math.sqrt(
      rates.reduce((a, b) => a + (b - mean) * (b - mean), 0) /
        (rates.length || 1)
    ) || 1;

  const ratings: DraftRatings = {};
  rated.forEach((c) => {
    const gihwr = c.ever_drawn_win_rate as number;
    ratings[c.mtga_id] = {
      grade: gradeFor((gihwr - mean) / std),
      gihwr,
      alsa: c.avg_seen ?? 0,
    };
  });
  return ratings;
}

function postRatings(ratings: DraftRatings): void {
  postChannelMessage({ type: "DRAFT_RATINGS", value: ratings });
}

/**
 * Fetch ratings for the event's set and broadcast them to the overlay. Safe to
 * call on every draft status update — after the first call per queue it only
 * re-broadcasts the cached result (so an overlay that opened late still gets
 * them).
 */
export default function loadDraftRatings(eventId: string): void {
  if (!isElectron()) return;

  const set = getSetInEventId(eventId);
  if (!set) return;

  const eventType = eventTypeFor(eventId);
  const key = `${set}-${eventType}`;

  const cached = cache[key];
  if (cached) {
    postRatings(cached);
    return;
  }
  if (pending[key]) return;
  pending[key] = true;

  const url = `https://www.17lands.com/api/card_data?expansion=${set}&event_type=${eventType}&time_period=ALL_TIME`;
  httpsGetJson(url)
    .then((json) => {
      const cards: SeventeenLandsCard[] = json?.data ?? [];
      const ratings = toRatings(cards);
      cache[key] = ratings;
      pending[key] = false;
      if (Object.keys(ratings).length > 0) {
        postRatings(ratings);
      }
    })
    .catch((e) => {
      pending[key] = false;
      console.warn("17lands ratings fetch failed", e);
    });
}
