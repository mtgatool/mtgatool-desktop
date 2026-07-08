# Supabase backend (v6)

The v6 cloud backend for mtgatool-desktop. Replaces the removed tool-db p2p
layer (see `LEGACY_TOOLDB_DATA_MODEL.md`). Local data still lives in
IndexedDB (`src/data/localKV.ts`); Supabase provides identity now and will
provide sync + community features next.

## Project

- Project: **mtgatool** (`decenyvqkbvydrrolwpk`), region us-west-2.
- URL: `https://decenyvqkbvydrrolwpk.supabase.co`
- Client + publishable key: `src/data/supabase.ts`. The publishable key is
  public by design — it only identifies the project; Row Level Security is
  the actual authorization boundary. Never put the `service_role` key in the
  repo or the app.

## Auth model (username / password, no PII)

- Accounts are username + password only. No real email, no other personal
  data. The only stored profile field is the public username.
- Supabase auth is email-keyed, so a username maps to a synthetic address
  `user-<username>@mtgatool.com` (`src/data/cloudAuth.ts`). These addresses
  are never emailed.
- Because there is no real inbox to confirm, a `BEFORE INSERT` trigger on
  `auth.users` (`public.auto_confirm_synthetic_email`) sets
  `email_confirmed_at` for any `user-%@mtgatool.com` signup, so
  signup → login works immediately. This means **no dashboard "Confirm
  email" toggle is required** — the flow is self-contained. (If real email
  is ever added, scope or drop that trigger.)
- The app also offers "Continue offline" — no account, data stays local
  (`autoLogin = "local"` vs `"true"` for a cloud session).

## Schema (applied via migrations)

- `public.profiles` — one row per account: `id` (= `auth.uid()`), unique
  lowercase `username` (`^[a-z0-9_-]{3,24}$`), `created_at`.
  - RLS: select = public (usernames show on community features); update =
    owner only; inserts happen only through the signup trigger.
- `public.handle_new_user()` — `AFTER INSERT` trigger on `auth.users`,
  creates the profile row from `raw_user_meta_data.username`.
- Both trigger functions have `EXECUTE` revoked from `anon`/`authenticated`
  so they are not callable via the REST RPC endpoint (satisfies the
  Supabase security advisor).

Run `get_advisors(security)` after any schema change.

## Client-side build note (important)

`react-scripts@4.0.3` runs on **webpack 4**, which cannot handle the ESM
(`.mjs` / rolldown getter-export) builds shipped by newer `@supabase/*`
packages — it fails with `Attempted import error: 'createClient' is not
exported`. Two things keep the build green:

1. `@supabase/supabase-js` is pinned to **2.39.8** (the last line that ships
   classic esbuild `dist/main` CommonJS). Do **not** bump it without moving
   off webpack 4 (CRA 5 / Vite) first.
2. `supabaseCjsAlias.js` aliases every `@supabase/*` package to its CJS
   `main`, wired into all three craco configs, so webpack never touches the
   ESM entry.

## Sync schema (applied)

One app user (`auth.uid()`) links **many** MTG Arena accounts; all game data
is partitioned by `(user_id, arena_id)`.

- `arena_accounts (user_id, arena_id, display_name, linked_at, last_seen_at)`
  — PK `(user_id, arena_id)`. The linked MTGA identities; also the data
  source for the top-nav account switcher. `arena_id` = the reader's
  `personaId` (stable join key); `display_name` is the mutable
  `Name#12345` shown in UI.
- `matches (user_id, match_id, arena_id, event_id, played_at, deck cols,
  win/loss, internal_match jsonb, ...)` — PK `(user_id, match_id)`.
- `decks`, `arena_collection`, `arena_inventory`, `arena_ranks` — same
  `(user_id, arena_id)` ownership; collection/inventory/ranks are one
  current-state row per arena account, decks are one row per `deck_id`.
- Every data table has an FK `(user_id, arena_id) → arena_accounts`, so a
  match/deck/etc. can't exist without its arena account being linked first.
- `user_id` **defaults to `auth.uid()`** — clients never send it.
- RLS `FOR ALL USING ((select auth.uid()) = user_id)` on every table.

### Anti-spoof guarantee (verified end-to-end)

`arena_id` (the MTGA persona id) is readable from anyone's logs/memory, so it
is **never** treated as a global identity — it is not unique across users.
Ownership is `(user_id, arena_id)` + RLS on `auth.uid()`. Tested with two
users: user B linking the *same* `arena_id` as user A still reads `[]` of A's
matches; each client only ever writes into and reads from its own partition.
Spoofing the persona id only pollutes the spoofer's own data.

Generated types live in `src/data/database.types.ts` (regenerate after
migrations); the client in `src/data/supabase.ts` is typed with them.

## Next steps (not yet built)

- **Client sync loop**: on login, read the current persona → upsert
  `arena_accounts` → tag every synced row with `(auth.uid(), personaId)`;
  outbox in the local KV → push to Supabase when online; hydrate the
  per-account switcher (was `userids`/`ArenaIdSelector`) from
  `arena_accounts`.
- **Community**: materialized views for explore/meta winrates + a live feed,
  replacing the old p2p aggregation. Note the open question — client-submitted
  match data can be spoofed to pollute *aggregates* (a data-quality problem,
  distinct from the data-theft one the RLS design already solves).
