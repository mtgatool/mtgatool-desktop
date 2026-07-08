import upsertDbRank from "../data/upsertDbRank";
import { pushDebug } from "../utils/debugLog";
import { isMemoryReadingAvailable } from "../utils/mtgaReader";
import readCards from "./readCards";
import readDecks from "./readDecks";
import readInventory from "./readInventory";
import readPlayerId from "./readPlayerid";
import readRank from "./readRank";

/**
 * Scene-driven memory sync.
 *
 * Wizards has hollowed out the Arena log (see docs/LOG_FORMAT.md): decks,
 * collection, inventory, rank and account are no longer emitted, so we read
 * them from process memory instead. The log's remaining value for these is as
 * a *notification* that the player moved between scenes — which is a natural
 * cue for when the underlying data has likely changed.
 *
 * Runs in the main window (where the visible redux store lives), triggered by
 * the SET_SCENE channel message.
 */

// Scenes whose exit implies the saved decks may have changed.
const DECK_SCENES = ["DeckBuilder", "DeckListViewer"];

function fireAndForget(p: Promise<unknown>): void {
  p.catch(() => {
    // background sync; ignore failures (MTGA not running / not elevated)
  });
}

/**
 * Read everything once from memory. Called after the initial log read
 * finishes (i.e. on login) so the account, collection, decks, inventory and
 * rank populate even if no scene change happens.
 */
export async function syncAll(): Promise<void> {
  if (!isMemoryReadingAvailable()) {
    pushDebug("syncAll skipped: memory reading unavailable");
    return;
  }
  // Read the account FIRST so playerId/currentUUID is set before the other
  // reads persist — otherwise they store under "default" and the UI (keyed on
  // the real uuid) shows nothing.
  pushDebug("syncAll: reading account…");
  await readPlayerId();

  pushDebug("syncAll: reading collection/decks/inventory/rank");
  fireAndForget(readCards());
  fireAndForget(readInventory());
  fireAndForget(readDecks());
  fireAndForget(
    readRank().then((rank) => {
      if (rank) upsertDbRank(rank);
    })
  );
}

export default function sceneSync(from: string, to: string): void {
  if (!isMemoryReadingAvailable()) return;
  pushDebug(`scene: ${from} → ${to}`);

  // Back to the main menu: refresh identity, wallet and rank.
  if (to === "Home") {
    fireAndForget(readPlayerId());
    fireAndForget(readInventory());
    fireAndForget(
      readRank().then((rank) => {
        if (rank) upsertDbRank(rank);
      })
    );
  }

  // Left the deck builder / deck manager: re-read saved decks, and the
  // collection too (crafting changes owned cards).
  if (DECK_SCENES.includes(from)) {
    fireAndForget(readDecks());
    fireAndForget(readCards());
  }

  // Finished opening packs: collection and wallet changed.
  if (from === "BoosterChamber") {
    fireAndForget(readCards());
    fireAndForget(readInventory());
  }

  // NOTE: entering a "Draft" scene is the only draft signal left in the log.
  // Draft pack/pick data is not exposed by the reader yet (no readDraft), so
  // draft-from-memory is deferred — see docs/LOG_FORMAT.md.
}
