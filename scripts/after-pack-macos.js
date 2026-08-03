/**
 * electron-builder afterPack hook — macOS only.
 *
 * The deck tracker reads MTGA's process memory via `task_for_pid`, which macOS
 * refuses unless the caller is root OR carries the
 * `com.apple.security.cs.debugger` entitlement. Entitlements only exist inside
 * a code signature, so an unsigned build simply cannot read memory.
 *
 * We have no Developer ID, but an **ad-hoc** signature (`-s -`) carrying the
 * entitlement is enough: verified on a stock machine (SIP enabled, no
 * boot-args) reading the live game as a normal user, no sudo.
 *
 * Why afterPack and not afterSign: electron-builder skips the `afterSign` hook
 * entirely when no signing happened ("skipping afterSign hook as no signing
 * occurred"), which is exactly our case. `afterPack` runs before its signing
 * step, so with no identity configured nothing overwrites what we do here.
 *
 * Two flags matter:
 *   --deep            the entitlement must reach the *renderer* helper, which
 *                     is where the reader is actually called from.
 *   NO --options runtime
 *                     ad-hoc + hardened runtime makes Electron's nested dylibs
 *                     fail library validation; the app then dies with SIGTRAP.
 *
 * Note for users: a downloaded .dmg is quarantined, and a quarantined ad-hoc
 * binary is killed on launch (SIGKILL) regardless of entitlements. They must
 * clear it once — see the macOS install notes in the README.
 */

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = async function afterPackMacos(context) {
  if (context.electronPlatformName !== "darwin") return;

  const { appOutDir } = context;
  const appName = fs
    .readdirSync(appOutDir)
    .find((f) => f.endsWith(".app"));

  if (!appName) {
    throw new Error(`afterPack: no .app bundle found in ${appOutDir}`);
  }

  const appPath = path.join(appOutDir, appName);
  const entitlements = path.join(__dirname, "..", "entitlements.mac.plist");

  if (!fs.existsSync(entitlements)) {
    throw new Error(`afterPack: entitlements not found at ${entitlements}`);
  }

  console.log(`  • ad-hoc signing with debugger entitlement  app=${appName}`);

  execFileSync(
    "codesign",
    ["-s", "-", "-f", "--deep", "--entitlements", entitlements, appPath],
    { stdio: "inherit" }
  );

  // Fail the build rather than ship something that silently can't read memory.
  const got = execFileSync("codesign", ["-d", "--entitlements", "-", appPath], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (!got.includes("com.apple.security.cs.debugger")) {
    throw new Error(
      "afterPack: debugger entitlement missing after signing — the build would not be able to read MTGA memory"
    );
  }

  console.log("  • verified: com.apple.security.cs.debugger present");
};
