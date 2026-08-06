#!/usr/bin/env node
/* eslint-disable no-use-before-define */
/* eslint-disable no-console */
/**
 * Cut a release: check, test, bump, stamp, commit, tag, push.
 *
 *   npm run release:tag -- patch          7.1.0 -> 7.1.1
 *   npm run release:tag -- minor          7.1.0 -> 7.2.0
 *   npm run release:tag -- major          7.1.0 -> 8.0.0
 *   npm run release:tag                   asks, showing all three
 *
 * The `--` is npm's, and is required: without it npm eats the arguments.
 *
 * Flags:
 *   --dry-run       do everything up to the commit, then undo the bump. Use
 *                   this to see what a release would do without doing it.
 *   --skip-tests    skip typecheck/lint/tests. For when they have just run.
 *   --yes           don't ask before pushing. Needs an explicit bump type.
 *   --allow-branch  release from somewhere other than dev.
 *
 * What happens, in order. It stops at the first thing that is wrong, and
 * nothing is touched until every check has passed:
 *
 *   1. checks    on dev, clean tree, not behind origin, tag is free
 *   2. tests     tsc, eslint, jest
 *   3. bumps     package.json + package-lock.json + src/info.json
 *   4. asks      shows the diff, says plainly that this ships to users
 *   5. ships     commit, annotated tag, push --follow-tags
 *   6. watches   waits for the workflow run, tells you how to retry if none
 *
 * If it stops before step 5 the bump is undone. If the push itself fails, the
 * commit and tag stay put and it prints the command to unwind them.
 *
 * If no workflow run appears, the tag is almost certainly fine — check
 * githubstatus.com first, then re-run from the Actions tab (Release -> Run
 * workflow -> pick the tag). Re-tagging is not a retry: it starts a second run
 * competing with the first for the same runners.
 *
 * Every step here has drawn blood at least once, which is why it is a script
 * rather than a list of commands in a readme:
 *
 *  - A lightweight tag is silently skipped by `git push --follow-tags`, so the
 *    release never fires and nothing says why. This only makes annotated ones,
 *    and checks the pushed tag is annotated afterwards.
 *  - `package-lock.json` is what CI installs from, not `package.json`. Editing
 *    the version by hand leaves the lockfile behind; `npm version` moves both.
 *  - src/info.json has to be regenerated or the app reports the old version,
 *    and the What's New popup — which fires on a version change — never shows.
 *  - A run can simply not appear, and it usually is not the tag's fault. An
 *    Actions outage swallowed v7.1.0's, which looked exactly like a missed tag
 *    push. This waits and tells you where to look, so the reflex is to check
 *    rather than to re-tag and end up with two runs racing each other.
 *
 * A tag push ships: release.yml publishes a GitHub release and electron-updater
 * pulls existing users onto it. Nothing here is pushed without confirmation.
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const RELEASE_BRANCH = "dev";
// The three files a version lives in. Committed by name rather than with
// `commit -a`, so an unrelated stray edit cannot ride along into a release.
const VERSIONED_FILES = ["package.json", "package-lock.json", "src/info.json"];
const REPO = path.resolve(__dirname, "..");

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const DRY_RUN = flag("dry-run");
const ASSUME_YES = flag("yes");
const SKIP_TESTS = flag("skip-tests");
const ALLOW_BRANCH = flag("allow-branch");
const bumpType = argv.find((a) => !a.startsWith("--"));

function fail(message, hint) {
  console.error(`\n✗ ${message}`);
  if (hint) console.error(`  ${hint}`);
  process.exit(1);
}

/** Capture a command's output. Throws on non-zero. */
function capture(cmd, args) {
  return execFileSync(cmd, args, { cwd: REPO, encoding: "utf8" }).trim();
}

/** Run a command with its output attached to this terminal. */
function show(cmd, args) {
  execFileSync(cmd, args, { cwd: REPO, stdio: "inherit" });
}

function git(...args) {
  return capture("git", args);
}

function ask(question) {
  if (ASSUME_YES) return Promise.resolve("y");
  if (!process.stdin.isTTY) {
    fail("Need an answer but there is no terminal.", "Re-run with --yes.");
  }
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    })
  );
}

function nextVersion(current, type) {
  const parsed = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);
  if (!parsed) {
    fail(
      `Cannot read "${current}" as a plain X.Y.Z version.`,
      "Set package.json to a release version first."
    );
  }
  const [major, minor, patch] = parsed.slice(1).map(Number);
  if (type === "major") return `${major + 1}.0.0`;
  if (type === "minor") return `${major}.${minor + 1}.0`;
  if (type === "patch") return `${major}.${minor}.${patch + 1}`;
  return null;
}

function readVersion() {
  return JSON.parse(fs.readFileSync(path.join(REPO, "package.json"), "utf8"))
    .version;
}

/** Put the version files back the way they were. */
function restoreVersionFiles() {
  try {
    show("git", ["checkout", "--", ...VERSIONED_FILES]);
  } catch (e) {
    console.error("  (could not restore the version files — check git status)");
  }
}

async function main() {
  const current = readVersion();

  // --- pick the bump ------------------------------------------------------
  let type = bumpType;
  if (!type) {
    console.log(`\nCurrent version: ${current}\n`);
    console.log(`  patch  ->  ${nextVersion(current, "patch")}`);
    console.log(`  minor  ->  ${nextVersion(current, "minor")}`);
    console.log(`  major  ->  ${nextVersion(current, "major")}\n`);
    // Asking here with no terminal — or with --yes, which answers "y" to
    // everything — would take that answer as the bump type and fail obscurely.
    if (!process.stdin.isTTY || ASSUME_YES) {
      fail(
        "No bump type given.",
        "Pass one: npm run release:tag -- patch|minor|major"
      );
    }
    type = await ask("Which? [patch/minor/major] ");
  }
  const version = nextVersion(current, type);
  if (!version)
    fail(`Unknown bump type "${type}".`, "Use patch, minor or major.");
  const tag = `v${version}`;

  // --- checks, before anything is touched ---------------------------------
  console.log(`\nReleasing ${current} -> ${version} (${tag})\n`);

  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  if (branch !== RELEASE_BRANCH && !ALLOW_BRANCH) {
    fail(
      `On "${branch}", but releases are cut from "${RELEASE_BRANCH}".`,
      `Switch branches, or pass --allow-branch if you really mean it.`
    );
  }

  if (git("status", "--porcelain")) {
    show("git", ["status", "--short"]);
    fail(
      "Working tree is not clean.",
      "Commit or stash first — a release commit should only carry the version."
    );
  }

  console.log("Fetching origin...");
  show("git", ["fetch", "origin", "--tags", "--quiet"]);

  const behind = git("rev-list", "--count", `HEAD..origin/${RELEASE_BRANCH}`);
  if (behind !== "0") {
    fail(
      `Local ${RELEASE_BRANCH} is ${behind} commit(s) behind origin.`,
      "Pull first — otherwise the tag misses what is already released."
    );
  }

  const localTag = git("tag", "--list", tag);
  const remoteTag = git("ls-remote", "--tags", "origin", `refs/tags/${tag}`);
  if (localTag || remoteTag) {
    fail(
      `Tag ${tag} already exists ${localTag ? "locally" : ""}${
        localTag && remoteTag ? " and " : ""
      }${remoteTag ? "on origin" : ""}.`,
      "Pick a different bump, or delete the tag if it was a mistake."
    );
  }

  const ahead = git("rev-list", "--count", `origin/${RELEASE_BRANCH}..HEAD`);
  console.log(
    `✓ on ${branch}, clean, up to date (${ahead} unpushed commit(s))`
  );

  // --- tests --------------------------------------------------------------
  if (SKIP_TESTS) {
    console.log("\n! Skipping tests (--skip-tests)");
  } else {
    console.log("\nTypechecking...");
    show("npx", ["tsc", "--noEmit", "-p", "tsconfig.json"]);
    console.log("Linting...");
    show("npm", ["run", "test:eslint"]);
    console.log("Running tests...");
    show("npm", ["run", "jest:ci"]);
    console.log("\n✓ typecheck, lint and tests pass");
  }

  // --- bump ---------------------------------------------------------------
  // npm version keeps package-lock.json in step; generateInfo.js stamps
  // src/info.json, which is what the app and the What's New popup read.
  console.log("\nBumping version...");
  show("npm", ["version", version, "--no-git-tag-version"]);
  show("node", ["generateInfo.js"]);

  const stamped = JSON.parse(
    fs.readFileSync(path.join(REPO, "src", "info.json"), "utf8")
  );
  const lockVersion = JSON.parse(
    fs.readFileSync(path.join(REPO, "package-lock.json"), "utf8")
  ).version;
  if (
    readVersion() !== version ||
    stamped.version !== version ||
    lockVersion !== version
  ) {
    restoreVersionFiles();
    fail(
      "Version did not land in all three files.",
      `package.json ${readVersion()}, lock ${lockVersion}, info.json ${
        stamped.version
      }`
    );
  }
  console.log(
    `✓ package.json, package-lock.json and src/info.json at ${version}`
  );

  show("git", ["--no-pager", "diff", "--stat", "--", ...VERSIONED_FILES]);

  // --- confirm ------------------------------------------------------------
  if (DRY_RUN) {
    console.log("\n--dry-run: stopping before commit. Undoing the bump.");
    restoreVersionFiles();
    return;
  }

  console.log(
    `\nThis publishes a GitHub release and auto-updates existing users.`
  );
  const answer = await ask(
    `Commit, tag ${tag} and push to ${RELEASE_BRANCH}? [y/N] `
  );
  if (answer !== "y" && answer !== "yes") {
    console.log("Stopped. Undoing the bump.");
    restoreVersionFiles();
    return;
  }

  // --- commit, tag, push --------------------------------------------------
  show("git", ["add", "--", ...VERSIONED_FILES]);
  show("git", ["commit", "-m", `Bump version to ${version}`]);
  // -a: annotated. A lightweight tag is skipped by --follow-tags and the
  // release silently never happens.
  show("git", ["tag", "-a", tag, "-m", tag]);

  if (git("cat-file", "-t", tag) !== "tag") {
    fail(
      `${tag} is not an annotated tag.`,
      "It would not be pushed. Delete it and re-run."
    );
  }

  console.log("\nPushing...");
  try {
    show("git", ["push", "origin", RELEASE_BRANCH, "--follow-tags"]);
  } catch (e) {
    fail(
      "Push failed. The commit and tag exist locally.",
      `Undo with:  git tag -d ${tag} && git reset --hard HEAD~1`
    );
  }

  if (!git("ls-remote", "--tags", "origin", `refs/tags/${tag}^{}`)) {
    fail(
      `${tag} did not reach origin as an annotated tag.`,
      `Push it explicitly:  git push origin ${tag}`
    );
  }
  console.log(`\n✓ ${tag} pushed`);

  await checkWorkflowStarted(tag);
}

/**
 * A pushed tag does not reliably start the release workflow — best effort, so
 * a missing `gh` just skips it rather than failing a release that already went
 * out fine.
 */
async function checkWorkflowStarted(tag) {
  const sha = git("rev-parse", "HEAD");
  try {
    capture("gh", ["--version"]);
  } catch (e) {
    console.log("\n(gh not installed — check the Actions tab for the run.)");
    return;
  }

  process.stdout.write("Waiting for the release workflow");
  for (let i = 0; i < 12; i += 1) {
    try {
      const count = capture("gh", [
        "api",
        `repos/{owner}/{repo}/actions/runs?head_sha=${sha}`,
        "--jq",
        ".total_count",
      ]);
      if (count !== "0") {
        console.log(`\n✓ workflow started for ${tag}`);
        return;
      }
    } catch (e) {
      /* transient; keep waiting */
    }
    process.stdout.write(".");
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      setTimeout(resolve, 10000);
    });
  }

  console.log(`
! No workflow run appeared for ${tag} after two minutes.

  The tag is pushed and is almost certainly fine. Check githubstatus.com — an
  Actions outage looks exactly like this. Then re-run it from the Actions tab
  (Release -> Run workflow -> pick ${tag}).

  Do not re-tag to retry; that just races a second run against the first.
`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
