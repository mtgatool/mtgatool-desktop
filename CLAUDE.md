# mtgatool-desktop — working notes

Electron deck tracker for MTG Arena. Game state comes from two places: log parsing,
and direct memory reads via the native [`mtga-reader`](https://github.com/mtgatool/mtga-reader)
addon (`src/reader/*.ts`, loaded with `__non_webpack_require__("mtga-reader")`).

See also `STRUCTURE.md` for the app layout.

## Releasing

**`dev` is the release branch.** `origin/HEAD → dev`, and the v7.x tags live only
on dev. `master` has been stuck at `ci: version bump to v6.7.5` since **October
2024**, which makes `main.yml` ("Bump Version", triggered on master) dead code —
don't rely on it to bump or tag anything.

To cut a release:

```bash
# 1. bump
#    edit package.json version, then:
node generateInfo.js
git commit -am "Bump version to X.Y.Z"

# 2. tag — MUST be annotated
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin dev --follow-tags
```

`--follow-tags` **only pushes annotated tags**. A lightweight `git tag vX.Y.Z`
is silently skipped and the release never fires; push it explicitly if you make
that mistake.

`release.yml` fires on `v*` and publishes a GitHub release. electron-updater is
wired to it (`publish: github`), so existing users auto-update — treat a tag push
as shipping to production.

### Two release traps that fail silently

**1. `package-lock.json` pins dependencies, not `package.json`.** CI runs
`npm install`, which installs from the lockfile. Widening a range in
`package.json` does nothing on its own. This shipped a broken 7.0.3: a correctly
signed macOS build that bundled `mtga-reader` 0.1.7 (no macOS support) because the
lock still pinned it, even though `package.json` allowed 0.1.8.

Verify the *artifact*, not the config:

```bash
npx @electron/asar extract-file "<App>.app/Contents/Resources/app.asar" \
  node_modules/mtga-reader/package.json
```

**2. Retired GitHub runner images leave the matrix job queued forever** — no error,
no failure, it just never gets scheduled while the other platforms publish happily.
This bit the macOS job twice (macos-12, then macos-13) and went unnoticed across two
releases: v7.0.1 and v7.0.2 shipped with **no macOS asset at all**, and v7.0.2's mac
job was still queued 22 hours later. After any release, check that every matrix job
actually ran.

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
