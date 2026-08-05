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
import { CardSet, DbCardDataV2 } from "../../types";
import loadCardsDbBytes from "./loadCardsDbBytes";
import rowToCard, { CARD_COLUMNS } from "./rowToCard";

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

  /**
   * Sets, set names and digital sets are loaded eagerly and read
   * synchronously.
   *
   * They are the exception to the async rule, and the reason is size: 238 sets
   * and ~500 code aliases, against 26,071 cards. Holding them costs a few
   * hundred KB and removes about half the call sites from the migration —
   * `database.sets[x]` is used inside render paths all over the app and there
   * is nothing to gain by making it await.
   */
  public sets: Record<string, CardSet> = {};

  public setNames: Record<string, string> = {};

  public digitalSets: string[] = [];

  public version = 0;

  public language = "EN";

  /**
   * Cards already fetched from the worker.
   *
   * Deliberately a plain memo, not a preload: nothing is here until something
   * asks for it. A bounded eviction policy can come later if a session ever
   * walks enough of the collection to matter — 26k cards is the ceiling, and
   * reaching it costs what the JSON used to cost from the start.
   */
  private cardCache = new Map<number, DbCardDataV2 | null>();

  /** In-flight batches, so N components asking for the same card make one query. */
  private cardWaiters = new Map<
    number,
    ((card: DbCardDataV2 | null) => void)[]
  >();

  private pendingIds = new Set<number>();

  private flushScheduled = false;

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

      // index.html carries `<base href="./">`, so a relative worker URL resolves
      // against the CURRENT ROUTE, not the app root. On /collection/dragon it
      // asks for /collection/dragon/cards-db-worker/worker.js, the dev server
      // answers with index.html, and a module worker refuses text/html — the
      // worker simply never starts.
      //
      // Anchoring to the origin fixes dev (http://localhost:3001) and the web
      // build. A packaged build loads from file://, which has no useful origin,
      // and there `<base href="./">` resolves against the build directory,
      // which is exactly right — so that is the one case left relative.
      const workerPath = "cards-db-worker/worker.js";
      const workerUrl =
        window.location.protocol === "file:"
          ? workerPath
          : `${window.location.origin}/${workerPath}`;

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
    await this.loadReferenceTables();

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

  /**
   * Sets, set names, digital sets and the version. Small enough to hold, and
   * read synchronously all over the app.
   */
  private async loadReferenceTables(): Promise<void> {
    const sets = await this.query(
      `SELECT name, code, arenacode, scryfall, collation, tile, release,
              collectible, digital, svg
         FROM sets`
    );
    this.sets = {};
    this.setNames = {};
    this.digitalSets = [];

    sets.values.forEach((row) => {
      const name = row[0] as string;
      this.sets[name] = {
        code: (row[1] as string) ?? "",
        arenacode: (row[2] as string) ?? "",
        scryfall: (row[3] as string) ?? "",
        // The database stores this as INTEGER or NULL; the app's type is
        // `number | false`, and false is what "no collation" meant.
        collation: row[4] === null ? false : (row[4] as number),
        tile: (row[5] as number) ?? 0,
        release: (row[6] as string) ?? "",
        collectible: !!row[7],
        svg: (row[9] as string) ?? undefined,
      } as CardSet;
      if (row[8]) this.digitalSets.push(name);
    });

    // setNames maps every alias, in both cases, to its set name — the shape
    // the JSON database exposed and the lookups all over the app expect.
    const aliases = await this.query(
      `SELECT a.alias, s.name FROM set_aliases a JOIN sets s ON s.id = a.set_id`
    );
    aliases.values.forEach((row) => {
      const alias = row[0] as string;
      const name = row[1] as string;
      this.setNames[alias] = name;
      this.setNames[alias.toUpperCase()] = name;
    });

    const meta = await this.query("SELECT key, value FROM meta");
    meta.values.forEach((row) => {
      if (row[0] === "version")
        this.version = parseInt(row[1] as string, 10) || 0;
      if (row[0] === "language") this.language = (row[1] as string) || "EN";
    });
  }

  /**
   * One card, or null if the database has no such grpId.
   *
   * Concurrent calls within a tick are coalesced into a single query: a deck
   * list asking for sixty cards one component at a time would otherwise be
   * sixty round trips to the worker.
   */
  public card(grpId: number): Promise<DbCardDataV2 | null> {
    if (!grpId) return Promise.resolve(null);

    const cached = this.cardCache.get(grpId);
    if (cached !== undefined) return Promise.resolve(cached);

    return new Promise((resolve) => {
      const waiters = this.cardWaiters.get(grpId);
      if (waiters) {
        waiters.push(resolve);
      } else {
        this.cardWaiters.set(grpId, [resolve]);
        this.pendingIds.add(grpId);
      }
      this.scheduleFlush();
    });
  }

  /** Several cards at once, in the order asked for. */
  public cards(grpIds: number[]): Promise<(DbCardDataV2 | null)[]> {
    return Promise.all(grpIds.map((id) => this.card(id)));
  }

  /** A card already in the cache, without waiting. Null when not loaded yet. */
  public cachedCard(grpId: number): DbCardDataV2 | null {
    return this.cardCache.get(grpId) ?? null;
  }

  private scheduleFlush(): void {
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    // A microtask, so everything rendered in the same pass batches together.
    Promise.resolve().then(() => {
      this.flushScheduled = false;
      this.flushCards().catch((e) => {
        console.log("[cards-db] card fetch failed", e);
      });
    });
  }

  private async flushCards(): Promise<void> {
    const ids = [...this.pendingIds];
    if (ids.length === 0) return;
    this.pendingIds.clear();

    const settle = (id: number, card: DbCardDataV2 | null): void => {
      this.cardCache.set(id, card);
      const waiters = this.cardWaiters.get(id);
      this.cardWaiters.delete(id);
      if (waiters) waiters.forEach((w) => w(card));
    };

    try {
      const placeholders = ids.map(() => "?").join(",");
      const result = await this.query(
        `SELECT ${CARD_COLUMNS} FROM cards WHERE grpid IN (${placeholders})`,
        ids
      );
      const found = new Set<number>();
      result.values.forEach((row) => {
        const card = rowToCard(row);
        found.add(card.GrpId);
        settle(card.GrpId, card);
      });
      // Cache the misses too, so a bad grpId is not asked for repeatedly.
      ids.forEach((id) => {
        if (!found.has(id)) settle(id, null);
      });
    } catch (e) {
      ids.forEach((id) => settle(id, null));
      throw e;
    }
  }

  /** Ability text by id. */
  public async ability(abilityId: number): Promise<string> {
    const result = await this.query("SELECT text FROM abilities WHERE id = ?", [
      abilityId,
    ]);
    return (result.values[0]?.[0] as string) ?? "";
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
