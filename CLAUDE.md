# mtgatool-desktop — working notes

Electron deck tracker for MTG Arena. Game state comes from two places: log parsing,
and direct memory reads via the native [`mtga-reader`](https://github.com/mtgatool/mtga-reader)
addon (`src/reader/*.ts`, loaded with `__non_webpack_require__("mtga-reader")`).

See also `STRUCTURE.md` for the app layout.

## Scope: do not widen it

**Do exactly what was asked, and nothing adjacent.** If the requested scope turns
out not to achieve the goal, stop and say so — do not extend it and report
afterwards. Reporting the widening is not the same as asking permission for it.

A narrow request is often narrow deliberately: to see what else surfaces, to keep
a change reviewable, or to limit the blast radius on real data. Widening it
destroys the thing the narrowness was for, even when the wider change works.

This came from a data repair scoped to "the last two matches of the two affected
decks". One record per deck turned out not to move the UI (`aggregateStats` reads
the *first* match of a deck hash, not the latest), so 11 records were rewritten
instead of 2. It happened to be correct, and it was still the wrong call — the
right move was to report the finding and wait.

Applies with most force to anything that writes user data, touches the GRE
parser, or lands on `dev`.

## Releasing

**`dev` is the release branch.** `origin/HEAD → dev`, and the v7.x tags live only
on dev. `master` has been stuck at `ci: version bump to v6.7.5` since **October
2024**, which makes `main.yml` ("Bump Version", triggered on master) dead code —
don't rely on it to bump or tag anything.

To cut a release:

```bash
npm run release:tag -- patch     # or minor / major, or omit to be asked
npm run release:tag -- minor --dry-run   # see what it would do, change nothing
```

`scripts/release-tag.js` does the whole thing: refuses to start unless you are
on `dev` with a clean tree, in sync, and the tag is free; runs tsc, eslint and
jest; bumps `package.json`, `package-lock.json` and `src/info.json` together;
shows you the diff and asks before pushing; tags **annotated**; then waits for
the workflow run. If it stops before pushing, the bump is undone. Its header
comment documents every flag.

Before it existed this was done by hand, and each part of it has failed at least
once — the notes below are why the script checks what it checks.

`--follow-tags` **only pushes annotated tags**. A lightweight `git tag vX.Y.Z`
is silently skipped and the release never fires; push it explicitly if you make
that mistake.

**A run that never appears is usually not the tag's fault.** When v7.1.0 was
tagged, no workflow run showed up for several minutes, the runs before it had
been cancelled, and jobs sat queued for hours — all of which looked like the
tag had been missed. It was a **GitHub Actions outage**; the run did arrive
late, and the tag had been fine the whole time.

Check <https://www.githubstatus.com> before concluding anything:

```bash
curl -s https://www.githubstatus.com/api/v2/summary.json | jq '.components[] | select(.name=="Actions")'
```

Do **not** reach for delete-and-re-push as a retry. It creates a second run
racing the first for the same runners, which is worse when runners are the
scarce thing:

```bash
# only if the tag is genuinely absent from the remote
git push origin :refs/tags/vX.Y.Z && git push origin vX.Y.Z
```

To retry properly, use "Re-run all jobs" on the existing run, or the
`workflow_dispatch` trigger on `release.yml` — pick the tag in the ref
dropdown. The version comes from the checked-out `package.json`, not the tag
name, so a dispatch on a tag builds exactly what a tag push would.

`release.yml` fires on `v*` and publishes a GitHub release. electron-updater is
wired to it (`publish: github`), so existing users auto-update — treat a tag push
as shipping to production.

**Add anything users will notice to `NEW_IN_THIS_VERSION` in
`src/components/WhatsNewPopup.tsx` as you go**, not at release time. That popup
fires on a version change, so whatever is in it when you tag is what everyone
reads.

### A release trap that fails silently

**`package-lock.json` pins dependencies, not `package.json`.** CI runs
`npm install`, which installs from the lockfile. Widening a range in
`package.json` does nothing on its own. This shipped a broken 7.0.3: a correctly
signed macOS build that bundled `mtga-reader` 0.1.7 (no macOS support) because the
lock still pinned it, even though `package.json` allowed 0.1.8.

Verify the *artifact*, not the config:

```bash
npx @electron/asar extract-file "<App>.app/Contents/Resources/app.asar" \
  node_modules/mtga-reader/package.json
```

## macOS specifics

The tracker reads MTGA memory via `task_for_pid`, which macOS refuses unless the
process is root **or** carries `com.apple.security.cs.debugger`. Entitlements only
exist inside a code signature, so an unsigned build simply cannot read memory.

There's no Developer ID, and an **ad-hoc** signature carrying the entitlement is
enough — verified on a stock machine (SIP enabled) reading the live game as a normal
user. `scripts/after-pack-macos.js` does this at build time and **fails the build**
if the entitlement is missing afterwards.

- It's an **`afterPack`** hook, not `afterSign`: electron-builder skips `afterSign`
  entirely when no signing occurred, which is exactly our no-identity case.
- Sign with `--deep` (the entitlement must reach the **renderer** helper, which is
  where `src/reader/*` runs) and **without** `--options runtime` (ad-hoc + hardened
  runtime makes Electron's bundled dylibs fail library validation → `SIGTRAP` at
  launch).

A downloaded `.dmg` is quarantined, and a quarantined ad-hoc binary is **SIGKILLed**
whatever its entitlements — hence the one-time `xattr -dr com.apple.quarantine`
step in the README. Users do **not** need `sudo`.

Release builds run on **macos-14**, which is arm64-only, so the macOS artifact is
Apple Silicon. Rosetta was verified working (x64 Electron + `darwin-x64.node` reads
the arm64 game), so x64/universal is a viable option if Intel support is wanted.

### Developing on macOS

The dev Electron isn't signed by the packaging hook, so sign it once after
`npm install` (repeat whenever Electron is reinstalled):

```bash
codesign -s - -f --deep --entitlements entitlements.mac.plist \
  node_modules/electron/dist/Electron.app
```

Without it the reader fails and Settings reports it can't read MTGA's memory.

## Debugging a running dev app (renderer consoles + live eval)

The app is three renderer windows — **main**, **background** (log watcher, GRE
parser, Supabase Realtime) and **hover** — and each sends `console.log` only to
its own DevTools. None of it reaches the terminal, so `npm run start` shows you
the CRA dev server and the Electron **main process** only. Everything
interesting (`setDbMatch`, `src/reader/*`, the log watcher) is invisible by
default.

`scripts/cdp-console.js` attaches to all three over the Chrome DevTools
Protocol. Start the app with the port open, then:

```bash
MTGA_DEBUG_PORT=9222 npm run start

node scripts/cdp-console.js                    # stream every window
node scripts/cdp-console.js --all              # ...including build noise
node scripts/cdp-console.js --list             # which windows are attached
node scripts/cdp-console.js --window bg --eval "globalData.matchesIndex.length"
```

**`--eval` is the valuable half**: it runs arbitrary JS inside a window and
returns the result. `window.store` is exposed (`redux/stores/rendererStore`), so
live Redux state is one command away, as is IndexedDB:

```bash
# what the history list is actually rendering from
node scripts/cdp-console.js --window main --eval \
  "(() => { const s = store.getState().mainData; return { matches: s.matchesIndex.length, remote: s.remoteMatchesIndex.length }; })()"
```

Run it in the background (`run_in_background`) and read the output file as the
session goes — no copy-pasting console output.

Things that will bite you if you touch this script:

- **CDP reports the *page* title, which is useless here.** All three windows
  load the same URL and never set `document.title`, so every target comes back
  as `localhost:3001`. The app keys its role off the *BrowserWindow* title
  (`src/utils/electron/getWindowTitle`), reachable only from inside the
  renderer — hence the script asks each window via
  `require('@electron/remote').getCurrentWindow().getTitle()`. Also filter out
  `chrome-extension://` targets or the React/Redux devtools show up as windows.
- **`Runtime.enable` replays the window's buffered console history**, so stamp
  events with `params.timestamp`, not `Date.now()`, or a whole boot sequence
  looks simultaneous. Enable it *after* resolving the label, or the backlog
  lands under a placeholder.
- The CRA dev server echoes every scss warning into all three windows; that's
  what the default noise filter drops.

The port is gated on `!app.isPackaged && MTGA_DEBUG_PORT` (`public/electron.js`).
The env var alone is not enough — otherwise anyone could set it before launching
an installed copy and get arbitrary code execution inside the app.

### Wiping local state to retest a fresh login

Settings and the Supabase session live in `localStorage`; everything else is in
IndexedDB `mtgatool-local`. All three windows share the origin, so clearing from
one clears for all. Clear the object *store* rather than deleting the database —
the background window holds an open connection and `deleteDatabase` blocks on it.

```bash
node scripts/cdp-console.js --window main --eval "(async () => { \
  const db = await new Promise((res,rej)=>{const q=indexedDB.open('mtgatool-local',1); q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error);}); \
  await new Promise((res,rej)=>{const tx=db.transaction('kv','readwrite'); const r=tx.objectStore('kv').clear(); r.onsuccess=()=>res(); r.onerror=()=>rej(r.error);}); \
  localStorage.clear(); return 'cleared'; })()"
```

Dropping `autoLogin` sends the app to `/auth`, i.e. the **manual** login path —
which is not the same code as auto-login and has had its own bugs.

### Fixed: HMR used to silently kill routing

Symptom, should it ever return: clicking the top nav does nothing, logging out
does nothing, clicking a deck or match does nothing — but no error appears and
the rest of the app still works. Settings and popups open fine, because they are
local state and never touch the router.

`window.location` updated while React Router's location did not. Both indexes
create their history at module scope; a hot update re-executes the module and
minted a *new* one. React Router v5 refuses to swap the history it subscribes to
(`Warning: You cannot change <Router history>`), keeping the original for its
location state while handing `useHistory()` consumers the new one — so every
push moved the URL and updated a history nobody was listening to.

Fixed by parking the instance on `window.__mtgaHistory` so re-execution reuses
it (`src/electronIndex.tsx`, `src/webIndex.tsx`). Production is unaffected: the
module only runs once there. **Don't "tidy" that back into a plain `const`.**

Diagnose a recurrence in one command — if the pathname disagrees with what's
rendered, this is why:

```bash
node scripts/cdp-console.js --window main --eval \
  "({ pathname: location.pathname, authForm: !!document.querySelector('.form-authenticate'), topNav: !!document.querySelector('.top-nav') })"
```

`/auth` with `topNav: true` and `authForm: false` is the fingerprint. Grep the
stream for `You cannot change <Router history>` to confirm.

### Worked example

Two long-standing bugs were found this way in one sitting, and both diagnoses
came from reading state rather than guessing:

- *Every match showed the "not uploaded" arrow after a fresh login, but not
  after a restart.* `--eval` showed `remoteMatchesIndex` empty while
  `matchesIndex` was full; grepping `syncMatches` call sites showed the manual
  login path never called it, while auto-login did.
- *Deleted matches kept coming back.* The console said nothing, but the
  Supabase MCP showed seven rows whose `created_at` was minutes ago and
  `played_at` weeks ago — another device re-pushing matches it never knew were
  deleted, because tombstones were local-only.

Pair the CDP tooling with the Supabase MCP: the client tells you what the app
believes, the database tells you what actually happened.

## Reader notes

- `isAdmin()` means **"can we read game memory"**, not "are we root" — on macOS it
  returns true when `task_for_pid` succeeds. `ReaderStatus.tsx` gates the *entire*
  reader on it, so a uid check would disable a perfectly capable entitled build.
- Typed readers (`readAccount`/`readCollection`/`readDecks`/`readRanks`/
  `readInventory`) are **home-screen only** — they return an error object during a
  match. Live-match data comes from `readData` with `MatchSceneManager` instead.
- All reader calls are async (native threadpool since 0.1.7) and return Promises,
  so they never block the renderer hosting the GRE parser.
- **`CommanderGrpId` no longer exists** on `PlayerInfo`; current game builds have
  `<Commanders>k__BackingField` (a `List<T>`). The field reads `undefined` today —
  on **all platforms**, not just macOS.
