/* eslint-disable no-console */
/**
 * Client for the card database worker.
 *
 * A module singleton, like `database`, because there must be exactly one of
 * these: the worker holds the only copy of the card data and the whole point is
 * not to make a second one.
 *
 * Everything is async, which is the real cost of this migration — SQLite in
 * wasm lives in a worker and a worker is a message boundary. The transport is
 * deliberately thin (`query(sql, params)`) so that moving ownership to the
 * background window later, or swapping in a native driver under Electron, is a
 * change to this file and nothing above it.
 */
import isElectron from "../electron/isElectron";
import loadCardsDbBytes from "./loadCardsDbBytes";

export interface QueryResult {
  columns: string[];
  values: unknown[][];
}

export interface FormatRow {
  id: number;
  name: string;
  word: number;
  mask: number;
}

interface Pending {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
}

class CardsDbClient {
  private worker: Worker | null = null;

  private pending = new Map<number, Pending>();

  private nextId = 1;

  private readyPromise: Promise<boolean> | null = null;

  private ready = false;

  /** Every format, with the location of its legality bit. */
  public formats: FormatRow[] = [];

  /** Lowercased format name -> row, for translating query filters. */
  public formatByName = new Map<string, FormatRow>();

  /** titleId -> format names, for the banned / suspended columns. */
  public bannedByTitle = new Map<number, string[]>();

  public suspendedByTitle = new Map<number, string[]>();

  public source = "";

  public get available(): boolean {
    return this.ready;
  }

  private post(message: any, transfer: ArrayBuffer[] = []): Promise<any> {
    if (!this.worker) return Promise.reject(new Error("Worker not started"));
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      (this.worker as Worker).postMessage({ ...message, id }, transfer);
    });
  }

  private handleMessage = (e: MessageEvent): void => {
    const { id, ok, result, error } = e.data || {};
    const entry = this.pending.get(id);
    if (!entry) return;
    this.pending.delete(id);
    if (ok) entry.resolve(result);
    else entry.reject(new Error(error));
  };

  /**
   * Start the worker and load the database.
   *
   * Idempotent, and never throws: it resolves false when there is no database
   * to load, which is the signal for callers to stay on the existing JSON path.
   */
  public init(): Promise<boolean> {
    if (this.readyPromise) return this.readyPromise;

    this.readyPromise = (async () => {
      const bytes = await loadCardsDbBytes();
      if (!bytes) return false;

      // index.html carries `<base href="./">`, so a relative worker URL would
      // resolve against the current route rather than the app root — the same
      // trap the old cards worker hit on a direct load of /collection.
      const workerUrl = isElectron()
        ? "cards-db-worker/worker.js"
        : `${window.location.origin}/cards-db-worker/worker.js`;

      try {
        this.worker = new Worker(workerUrl, { type: "module" });
        this.worker.onmessage = this.handleMessage;
        this.worker.onerror = (e) => {
          console.log("[cards-db] worker error", e.message || e);
        };

        const started = performance.now();
        const info = await this.post(
          {
            type: "init",
            wasmBinary: bytes.wasmBinary,
            dbBytes: bytes.dbBytes,
          },
          [bytes.wasmBinary, bytes.dbBytes]
        );

        await this.loadLookups();

        this.ready = true;
        this.source = bytes.source;
        console.log(
          `[cards-db] ready in ${(performance.now() - started).toFixed(0)}ms ` +
            `(v${info.version} ${info.language}) from ${bytes.source}`
        );
        return true;
      } catch (e) {
        console.log("[cards-db] failed to start, staying on JSON", e);
        this.ready = false;
        return false;
      }
    })();

    return this.readyPromise;
  }

  /**
   * Small reference tables pulled once. Formats are needed to translate a
   * legality filter into a bit test, and banned / suspended are a few hundred
   * rows total, so they are cheaper to hold than to join per query.
   */
  private async loadLookups(): Promise<void> {
    const formats = await this.query(
      "SELECT id, name, word, mask FROM formats ORDER BY id"
    );
    this.formats = formats.values.map((row) => ({
      id: row[0] as number,
      name: row[1] as string,
      word: row[2] as number,
      mask: row[3] as number,
    }));
    this.formatByName.clear();
    this.formats.forEach((f) => this.formatByName.set(f.name.toLowerCase(), f));

    const flags = await this.query(
      `SELECT f.name, fc.title_id, fc.kind
         FROM format_cards fc
         JOIN formats f ON f.id = fc.format_id
        WHERE fc.kind IN ('banned', 'suspended')`
    );
    this.bannedByTitle.clear();
    this.suspendedByTitle.clear();
    flags.values.forEach((row) => {
      const name = row[0] as string;
      const titleId = row[1] as number;
      const bag =
        row[2] === "banned" ? this.bannedByTitle : this.suspendedByTitle;
      const list = bag.get(titleId);
      if (list) list.push(name);
      else bag.set(titleId, [name]);
    });
  }

  public query(sql: string, params: unknown[] = []): Promise<QueryResult> {
    return this.post({ type: "query", sql, params });
  }

  /**
   * Replace the player's collection. `owned` and `acquired` are columns in the
   * worker's temp table, so this has to run before any query that reads them.
   */
  public setCollection(
    cards: Record<string, number>,
    prevCards: Record<string, number>
  ): Promise<number> {
    return this.post({ type: "setCollection", cards, prevCards });
  }

  /** Decode a card's legality bitmask into format names. */
  public decodeFormats(words: number[]): string[] {
    const out: string[] = [];
    this.formats.forEach((f) => {
      // eslint-disable-next-line no-bitwise
      if ((words[f.word] & f.mask) !== 0) out.push(f.name);
    });
    return out;
  }
}

const cardsDb = new CardsDbClient();

if (process.env.NODE_ENV === "development") {
  (window as any).__cardsDb = cardsDb;
}

export default cardsDb;
