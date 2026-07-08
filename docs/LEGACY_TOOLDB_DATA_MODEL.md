# Legacy tool-db data model (removed in v6)

> **Audience:** future maintainers and LLM assistants working on the Supabase
> migration. Until v6, the app stored and synced all user data through
> [tool-db](https://github.com/Manwe-777/tool-db), a p2p CRDT database over
> WebRTC. The experiment ended because there were never enough concurrent
> users for a p2p swarm to be viable. This file preserves the data model so
> the shapes can be mapped onto the new backend.
>
> The interim replacement (`src/data/`) keeps the same key/value shapes in
> plain IndexedDB, **local-only**, so migrating means: read these keys from
> IndexedDB → write to the new backend.

## Architecture (as it was)

- A WebWorker (`tooldb-worker/`, browserified into `public/tooldb-worker/index.js`)
  owned the ToolDb instance: ECDSA user adapter (identity = keypair),
  IndexedDB storage adapter, WebRTC network adapter, swarm topic
  `mtgatool-db-swarm-v4`.
- The renderer talked to it via `postMessage` through
  `src/toolDb/worker-wrapper.ts` (`getData`/`putData`/`queryKeys`/
  `addKeyListener`/`doFunction`/...).
- The worker mirrored DB changes into Redux (`SET_UUID_*`,
  `SET_REMOTE_MATCHES_INDEX`, `SET_LIVE_FEED`, ...) via `REDUX_ACTION`
  messages.

## Identity (as it was)

- Account = ECDSA keypair. `pubKey` (hex of JWK x+y) was the user id.
- Username lookup: public key `==${username}` → user root data (incl. pubKey).
- Password recovery: 12-word passphrase decrypting `:${pubKey}.recovery`
  (`{ recovery: <encrypted hint>, iv }`).
- localStorage kept: `pubkey`, `username`, `savedPass` (sha1), `playerId`
  (current MTGA persona UUID).
- One *account* (keypair) could own several MTGA player UUIDs ("userids").

**v6 replacement:** Supabase auth (`auth.uid()` replaces `pubKey`). Old
accounts are intentionally not migrated.

## Key naming scheme

Two kinds of keys:

1. **User-namespaced** (private, signed by owner): stored as
   `:${pubKey}.${key}`. The interim local layer stores these as
   `:local.${key}`.
2. **Public** (anyone could write, CRDT-merged): stored by plain key.

| Key | Namespaced | Value shape | Written by |
|---|---|---|---|
| `matches-${matchId}` | yes | `DbMatch` | `setDbMatch` on GAME_STATS |
| `draft-${draftId}` | yes | `InternalDraftv2` | DRAFT_STATUS channel msg |
| `${uuid}-cards` | yes | `DbCardsData` | `upsertDbCards` (memory reader / log) |
| `${uuid}-inventory` | yes | `DbInventoryData` | `upsertDbInventory` (log) |
| `${uuid}-rank` | yes | `DbRankData` | `upsertDbRank` (log + memory reader) |
| `${uuid}-displayname` | yes | `DbDisplayName` | `upsertDbDisplayName` |
| `userids` | yes | `DbUserids` = `Record<uuid, lastSeenTimestamp>` | `switchPlayerUUID` |
| `hiddenDecks` | yes | `string[]` (deck ids) | `setDbHiddenDecks` |
| `username` | yes | `string` | login |
| `privateMode` | yes | `boolean` | settings |
| `recovery` | yes | `UserRecoveryData` | passphrase setup |
| `rank-${pubKey}` | no | `DbRankDataWithKey` (public rank board) | `upsertDbRank` unless privateMode |
| `matches-livefeed-${YYYY-M-D}` | no | `string[]` match keys (community live feed) | worker `PUSH_DB_MATCH` |
| `livematch-${matchId}` | no | trimmed overlay `OverlayUpdateMatchState` (spectate) | `upsertDbLiveMatch` |
| `live-draft-v1-${draftId}` | no | `DbliveDraftV1` (community draft voting) | `createLiveDraft` |
| `==${username}` | no | user root data (keys/recovery) | signup |

Prefix queries used by the app: `:${pubKey}.matches-` (match index),
`:${pubKey}.draft-` (draft index).

## Document shapes

All of these still exist as TypeScript types in `src/types/dbTypes.ts`.

### DbMatch (one per finished match — the core dataset)

```ts
{
  matchId: string,
  playerId: string,          // MTGA persona UUID
  playerDeckId: string,
  playerDeckHash: string,
  playerDeckColors: number,  // color bit flags
  oppDeckColors: number,     // color bit flags
  playerName: string,
  playerWins: number,
  playerLosses: number,
  eventId: string,           // e.g. "Ladder", "AIBotMatch" (bot matches not stored)
  duration: number,          // seconds
  internalMatch: InternalMatch, // FULL match document (game log derived), large JSON
  timestamp: number,         // ms epoch
  pubKey: string             // owner (legacy identity)
}
```

Supabase note: promote `playerId`, `eventId`, `timestamp`, colors and the
win/loss columns; keep `internalMatch` as `jsonb`.

### DbCardsData — `{ cards: Record<grpId, qty>, prevCards: Record<grpId, qty>, updated }`
`prevCards` rotates when `updated` is older than ~24h; used for "new cards" diffing.

### DbInventoryData — `{ Gems, Gold, TotalVaultProgress, wcTrackPosition, WildCardCommons, WildCardUnCommons, WildCardRares, WildCardMythics, DraftTokens, SealedTokens, Boosters[], updated }`

### DbRankData — flat CombinedRankInfo + `updated`:
`playerId`, `{constructed,limited}SeasonOrdinal/Class/Level/Step/MatchesWon/MatchesLost/MatchesDrawn/Percentile/LeaderboardPlace`. `*Class` is a string ("Unranked", "Bronze", ..., "Mythic"; the memory reader also emits "Spark"/"Master" for the current MTGA rank tiers).

### DbDisplayName — `{ displayName: string | null, updated }`

### DbliveDraftV1 (community draft voting; feature dormant since removal)

```ts
{
  owner: string,             // pubKey
  ref: string,               // ':{pubKey}.draft-{id}' pointer to the draft doc
  votes: Record<`${pubKey}-${pack}-${pick}`, { pubKey, signature, pack, pick, vote }>
}
```

## Community features that died with tool-db (to rebuild on Supabase)

- **Explore / meta aggregation** — worker `beginDataQuery(day, eventId)`
  crawled public match/deck keys and aggregated winrates client-side.
  Supabase: materialized views over submitted matches.
- **Live feed** — `matches-livefeed-${day}` list, top-10 by timestamp on the
  Home view. Supabase: `select ... order by timestamp desc limit 10` or a
  realtime subscription.
- **Live match spectating** — `livematch-${matchId}` overlay state pushes.
- **Live draft voting** — `live-draft-v1-*` above.
- **Public rank leaderboard** — `rank-${pubKey}` records.
- **Peers UI** — ActivePeers list, connection status dot, `SET_OFFLINE`.

## Where the interim (local-only) layer lives

- `src/data/localKV.ts` — IndexedDB key/value + prefix query (database
  `mtgatool-local`, store `kv`).
- `src/data/store.ts` — replaces `src/toolDb/worker-wrapper.ts`; same
  function surface (`getData`, `putData`, `queryKeys`, `getMatchesData`, ...)
  implemented on localKV. The `upsertDb*`/`setDbMatch`/`setDbHiddenDecks`
  business helpers moved from `src/toolDb/` to `src/data/`.
- `src/data/localLogin.ts` — replaces the worker `afterLogin`: loads the
  local matches/drafts indexes, hidden decks and per-UUID data into Redux.
- User-namespaced keys use the fixed `:local.` prefix regardless of account.

## v6 identity (Supabase)

- `src/data/supabase.ts` + `src/data/cloudAuth.ts`: username/password on
  Supabase auth. Usernames map to synthetic addresses
  `user-<name>@mtgatool.com` (never emailed — "Confirm email" must stay
  disabled in the Supabase dashboard). The only profile data stored is the
  public username (`profiles` table, RLS: select all / update own, rows
  created by the `handle_new_user` trigger).
- "Continue offline" keeps the app usable with no account
  (`autoLogin = "local"`); match data stays in the local KV either way until
  the sync layer lands.
