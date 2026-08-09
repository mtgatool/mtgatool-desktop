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
import {
  CardsDbRequestMessage,
  CardsDbResponseMessage,
  ChannelMessage,
} from "../../broadcastChannel/channelMessages";
import { CardSet, DbCardDataV2 } from "../../types";
import {
  WINDOW_BACKGROUND,
  WINDOW_MAIN,
  WINDOW_UPDATER,
} from "../../types/app";
import bcConnect from "../bcConnect";
import getWindowTitle from "../electron/getWindowTitle";
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

  /**
   * Proxy mode. Overlay, hover and post-match windows do not own a worker:
   * loading a second ~17MB SQLite image into each of them is what made every
   * overlay cost as much RAM as the main window. Instead they forward queries
   * over the broadcast channel to the window that does own one (the background
   * window, which is always alive), and this whole client behaves as a thin
   * RPC — `query()` is the only method that touches the worker, so everything
   * built on it (cards, abilities, lookups) rides along unchanged.
   */
  private remote = false;

  private remoteChannel: BroadcastChannel | null = null;

  private remoteClientId = "";

  private serving = false;

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

  /** When the shipped database was generated (unix ms). */
  public updated = 0;

  /** Row count, read once so nothing has to hold the rows to count them. */
  public cardCount = 0;

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

  /**
   * Ability text, fetched on demand like cards.
   *
   * There are 20,836 of them and the log views ask for a handful at a time, so
   * the same rule applies: nothing is resident until something asks. `ability`
   * is read synchronously from a component body, so a miss returns undefined
   * and schedules the fetch, and the next render has it.
   */
  private abilityCache = new Map<number, string>();

  private pendingAbilities = new Set<number>();

  private abilityFlushScheduled = false;

  public source = "";

  /**
   * Notified once, when init settles.
   *
   * Anything that reads the eagerly-loaded values — sets, version, cardCount —
   * during its first render sees the empty defaults, because the database is
   * still being fetched. Without a signal those components never render again
   * and keep showing them; that is why the status panel read
   * "Cards database (0)" against a loaded database.
   */
  public readyListeners = new Set<() => void>();

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

    const title = getWindowTitle();
    this.remote =
      title !== WINDOW_MAIN &&
      title !== WINDOW_BACKGROUND &&
      title !== WINDOW_UPDATER;

    this.readyPromise = this.remote ? this.initRemote() : this.initLocal();
    return this.readyPromise;
  }

  /**
   * Proxy init: no worker, no 17MB image. Wire the channel first, then pull the
   * same small lookup tables the local path does — they go through `query()`,
   * which is now an RPC, so the owner answers them.
   */
  private async initRemote(): Promise<boolean> {
    try {
      this.remoteClientId = getWindowTitle();
      const channel = bcConnect() as BroadcastChannel;
      this.remoteChannel = channel;
      channel.addEventListener("message", this.handleRemoteResponse);

      // The owner (background window) may not be answering yet: it loads the
      // full app bundle and a 17MB database, while these proxy windows boot
      // from a slim bundle and get here first. A lookup query fired now would
      // hit a channel no one is listening on, time out, and — because init()
      // memoises its result — leave the proxy permanently broken. So ping until
      // the owner answers before doing anything that has to succeed.
      const ownerUp = await this.waitForOwner();
      if (!ownerUp) throw new Error("cards-db owner never answered");

      await this.loadLookups();

      this.ready = true;
      this.source = "remote";
      // eslint-disable-next-line no-console
      console.log("[cards-db] ready (proxy) via broadcast channel");
      this.readyListeners.forEach((fn) => fn());
      return true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("[cards-db] proxy init failed, will retry on demand", e);
      this.ready = false;
      // Do not cache the failure: a later card() call re-runs init(), by which
      // time the owner is up. Without this the first miss is forever.
      this.readyPromise = null;
      this.readyListeners.forEach((fn) => fn());
      return false;
    }
  }

  /**
   * Poll the owner with a cheap query until it answers. Each ping has a short
   * timeout so a not-yet-listening owner is detected quickly and retried,
   * rather than waiting out the full query timeout once.
   */
  private async waitForOwner(): Promise<boolean> {
    const attempts = 60;
    for (let i = 0; i < attempts; i += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await this.remoteQuery("SELECT 1", [], 1000);
        return true;
      } catch {
        // Not answering yet — the loop is the wait.
      }
    }
    return false;
  }

  private handleRemoteResponse = (e: MessageEvent): void => {
    const data = e.data as ChannelMessage | undefined;
    if (!data || data.type !== "CARDS_DB_RESPONSE") return;
    const { to, rid, ok, result, error } = (data as CardsDbResponseMessage)
      .value;
    if (to !== this.remoteClientId) return;
    const entry = this.pending.get(rid);
    if (!entry) return;
    this.pending.delete(rid);
    if (ok) entry.resolve(result);
    else entry.reject(new Error(error));
  };

  private remoteQuery(
    sql: string,
    params: unknown[],
    timeoutMs = 15000
  ): Promise<QueryResult> {
    const channel = this.remoteChannel;
    if (!channel) {
      return Promise.reject(new Error("cards-db proxy channel not ready"));
    }
    const rid = this.nextId;
    this.nextId += 1;
    return new Promise<QueryResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.pending.delete(rid)) {
          reject(new Error("cards-db proxy query timed out"));
        }
      }, timeoutMs);
      this.pending.set(rid, {
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value);
        },
        reject: (err) => {
          clearTimeout(timeout);
          reject(err);
        },
      });
      const msg: CardsDbRequestMessage = {
        type: "CARDS_DB_REQUEST",
        value: { from: this.remoteClientId, rid, sql, params },
      };
      channel.postMessage(msg);
    });
  }

  /**
   * Answer proxy windows' queries against this window's worker. Called once in
   * the background window (the owner), it listens on the same channel the rest
   * of the app uses — `addEventListener`, so it coexists with the window's
   * existing `onmessage` handler rather than replacing it.
   */
  public serveRemoteRequests(): void {
    if (this.serving) return;
    this.serving = true;
    const channel = bcConnect() as BroadcastChannel;
    channel.addEventListener("message", async (e: MessageEvent) => {
      const data = e.data as ChannelMessage | undefined;
      if (!data || data.type !== "CARDS_DB_REQUEST") return;
      const { from, rid, sql, params } = (data as CardsDbRequestMessage).value;
      let response: CardsDbResponseMessage;
      try {
        // Idempotent, and guarantees the worker is up before the first query
        // an overlay fires on open.
        await this.init();
        const result = await this.query(sql, params);
        response = {
          type: "CARDS_DB_RESPONSE",
          value: { to: from, rid, ok: true, result },
        };
      } catch (err: any) {
        response = {
          type: "CARDS_DB_RESPONSE",
          value: {
            to: from,
            rid,
            ok: false,
            error: String(err && err.message ? err.message : err),
          },
        };
      }
      channel.postMessage(response);
    });
  }

  /** Worker init: owns the SQLite image. Used by the main and background windows. */
  private initLocal(): Promise<boolean> {
    return (async () => {
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
        this.readyListeners.forEach((fn) => fn());
        return true;
      } catch (e) {
        console.log("[cards-db] failed to start", e);
        this.ready = false;
        this.readyListeners.forEach((fn) => fn());
        return false;
      }
    })();
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
    if (this.remote) return this.remoteQuery(sql, params);
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
    // Proxy windows don't own the collection table and never display owned /
    // acquired counts, so there is nothing to set — the owner holds it. Only
    // the main window (ContentWrapper) calls this in practice.
    if (this.remote) return Promise.resolve(0);
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
      if (row[0] === "version") {
        this.version = parseInt(row[1] as string, 10) || 0;
      }
      if (row[0] === "language") this.language = (row[1] as string) || "EN";
      if (row[0] === "updated") {
        this.updated = parseInt(row[1] as string, 10) || 0;
      }
    });

    // Counted here rather than by holding the rows to count them.
    const count = await this.query("SELECT COUNT(*) FROM cards");
    this.cardCount = (count.values[0]?.[0] as number) ?? 0;
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

    // Wait for the database before querying it. Views mount as soon as the
    // page does, which is long before an 18MB database has been fetched and
    // handed to the worker, so without this every card a deck list asks for on
    // first paint fails.
    const ready = await this.init();

    const settle = (id: number, card: DbCardDataV2 | null): void => {
      this.cardCache.set(id, card);
      const waiters = this.cardWaiters.get(id);
      this.cardWaiters.delete(id);
      if (waiters) waiters.forEach((w) => w(card));
    };

    /**
     * Answer the waiters without caching, so the next request retries.
     *
     * Caching a failure is indistinguishable from caching a genuine miss, and
     * `card()` returns any cached value including null — so one transient
     * failure would make those cards permanently missing for the life of the
     * page, with nothing to trigger another attempt.
     */
    const fail = (id: number): void => {
      const waiters = this.cardWaiters.get(id);
      this.cardWaiters.delete(id);
      if (waiters) waiters.forEach((w) => w(null));
    };

    if (!ready) {
      ids.forEach(fail);
      return;
    }

    try {
      const placeholders = ids.map(() => "?").join(",");
      const result = await this.query(
        `SELECT ${CARD_COLUMNS} FROM cards WHERE grpid IN (${placeholders})`,
        ids
      );
      const found = new Set<number>();
      const cards = result.values.map(rowToCard);
      cards.forEach((card) => found.add(card.GrpId));

      // Pull in the other face of anything double-faced, in the same flush.
      //
      // A back face is a separate row with its own grpid, and asking for a
      // card has never brought it along — so every caller that wanted both
      // sides had to notice it was a DFC, request the second id, and wait for
      // it. Reading it straight from the cache instead found nothing and fell
      // back to the default tile, which is how a two-faced card came to be
      // hovered next to Evolving Wilds.
      //
      // Done here, before the waiters are settled, so both faces are in the
      // cache the moment the requested card resolves. That is what lets the
      // synchronous `database.card(id)` answer for a back face and keeps this
      // out of the components entirely.
      const linked = new Set<number>();
      cards.forEach((card) => {
        (card.LinkedFaceGrpIds || []).forEach((id) => {
          if (id && !found.has(id) && !this.cardCache.has(id)) linked.add(id);
        });
      });

      if (linked.size > 0) {
        const linkedIds = [...linked];
        const linkedRows = await this.query(
          `SELECT ${CARD_COLUMNS} FROM cards WHERE grpid IN (${linkedIds
            .map(() => "?")
            .join(",")})`,
          linkedIds
        );
        // Cached directly rather than settled: nothing asked for these, so
        // there are no waiters. A face that does not resolve is simply left
        // alone — it will be fetched normally if something ever asks.
        linkedRows.values.forEach((row) => {
          const card = rowToCard(row);
          this.cardCache.set(card.GrpId, card);
        });
      }

      cards.forEach((card) => settle(card.GrpId, card));
      // Cache the misses too, so a bad grpId is not asked for repeatedly.
      ids.forEach((id) => {
        if (!found.has(id)) settle(id, null);
      });
    } catch (e) {
      // Not cached — see `fail`. A query that failed says nothing about
      // whether the card exists.
      ids.forEach(fail);
      throw e;
    }
  }

  /** Ability text by id. */
  public async ability(abilityId: number): Promise<string> {
    const hit = this.abilityCache.get(abilityId);
    if (hit !== undefined) return hit;
    const result = await this.query("SELECT text FROM abilities WHERE id = ?", [
      abilityId,
    ]);
    const text = (result.values[0]?.[0] as string) ?? "";
    this.abilityCache.set(abilityId, text);
    return text;
  }

  /** Every ability fetched so far. */
  public get cachedAbilities(): Record<number, string> {
    const out: Record<number, string> = {};
    this.abilityCache.forEach((text, id) => {
      out[id] = text;
    });
    return out;
  }

  /**
   * Ability text, if fetched. Schedules the fetch on a miss so the next render
   * has it — the log views call this straight from a component body.
   */
  public cachedAbility(abilityId: number): string | undefined {
    const hit = this.abilityCache.get(abilityId);
    if (hit !== undefined) return hit;
    if (abilityId && !this.pendingAbilities.has(abilityId)) {
      this.pendingAbilities.add(abilityId);
      this.scheduleAbilityFlush();
    }
    return undefined;
  }

  private scheduleAbilityFlush(): void {
    if (this.abilityFlushScheduled) return;
    this.abilityFlushScheduled = true;
    Promise.resolve().then(async () => {
      this.abilityFlushScheduled = false;
      const ids = [...this.pendingAbilities];
      this.pendingAbilities.clear();
      if (ids.length === 0) return;
      // Same as flushCards: the database is not up when the first views mount.
      if (!(await this.init())) return;
      try {
        const placeholders = ids.map(() => "?").join(",");
        const result = await this.query(
          `SELECT id, text FROM abilities WHERE id IN (${placeholders})`,
          ids
        );
        const found = new Set<number>();
        result.values.forEach((row) => {
          const id = row[0] as number;
          found.add(id);
          this.abilityCache.set(id, (row[1] as string) ?? "");
        });
        ids.forEach((id) => {
          if (!found.has(id)) this.abilityCache.set(id, "");
        });
        this.abilityListeners.forEach((fn) => fn());
      } catch (e) {
        console.log("[cards-db] ability fetch failed", e);
      }
    });
  }

  /** Notified when a batch of abilities lands, so views can re-render. */
  public abilityListeners = new Set<() => void>();

  /**
   * Fill the caches straight from a metadata JSON blob, for tests.
   *
   * The app no longer loads that JSON at all — this is the one place it is
   * still read, so the unit tests that assert things about real card data keep
   * working without the app paying for it at runtime. Not used outside tests.
   */
  public seedForTests(metadata: any): void {
    this.cardCache.clear();
    Object.keys(metadata.cards || {}).forEach((key) => {
      const card = metadata.cards[key];
      this.cardCache.set(card.GrpId, card as DbCardDataV2);
    });
    this.cardCount = this.cardCache.size;

    this.abilityCache.clear();
    Object.keys(metadata.abilities || {}).forEach((key) => {
      this.abilityCache.set(parseInt(key, 10), metadata.abilities[key]);
    });

    this.sets = metadata.sets || {};
    this.setNames = metadata.setNames || {};
    this.digitalSets = metadata.digitalSets || [];
    this.version = parseInt(metadata.version, 10) || 0;
    this.language = metadata.language || "EN";
    this.updated = metadata.updated || 0;
    this.ready = true;
  }

  /** Every card currently cached — tests only; the app pages instead. */
  public get cachedCards(): DbCardDataV2[] {
    const out: DbCardDataV2[] = [];
    this.cardCache.forEach((card) => {
      if (card) out.push(card);
    });
    return out;
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
