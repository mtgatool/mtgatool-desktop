#!/usr/bin/env node
/**
 * Read and drive the running app's renderer windows over the Chrome DevTools
 * Protocol.
 *
 * The three renderers (main, background, hover) send console output only to
 * their own DevTools window, so none of it — the log watcher, the GRE parser,
 * src/reader/* — reaches the terminal. This attaches to each window and streams
 * it, and can also evaluate expressions inside them.
 *
 * Start the app with the port open first:
 *
 *   MTGA_DEBUG_PORT=9222 npm run start
 *
 * then:
 *
 *   node scripts/cdp-console.js                       # stream every window
 *   node scripts/cdp-console.js --all                 # ...including build noise
 *   node scripts/cdp-console.js --list                # what's attached
 *   node scripts/cdp-console.js --eval "location.href"
 *   node scripts/cdp-console.js --window bg --eval "globalData.matchesIndex.length"
 *
 * Windows are labelled main / bg / hover / ov0-4 / updater.
 *
 * No dependencies: Node 18+ has fetch, Node 22 has a global WebSocket.
 */

const PORT = process.env.MTGA_DEBUG_PORT || "9222";
const HOST = `http://127.0.0.1:${PORT}`;
const POLL_MS = 3000;

/**
 * All three windows load the same URL and never set document.title, so the
 * `title` CDP reports is just "localhost:3001" for each. The app itself keys
 * its role off the *BrowserWindow* title (src/utils/electron/getWindowTitle),
 * which is only reachable from inside the renderer — hence asking it directly.
 */
const WINDOW_TITLE_EXPR =
  "require('@electron/remote').getCurrentWindow().getTitle()";

const SHORT = {
  "mtgatool-background": "bg",
  "mtgatool-hover": "hover",
  "mtgatool-updater": "updater",
  "MTG Arena Tool": "main",
};

/** Targets can appear mid-creation with an empty url, and `new URL("")` throws. */
function pathOf(target) {
  try {
    return new URL(target.url).pathname;
  } catch {
    return target.id ? target.id.slice(0, 6) : "?";
  }
}

function shortLabel(windowTitle, target) {
  if (SHORT[windowTitle]) return SHORT[windowTitle];
  if (windowTitle && windowTitle.startsWith("mtgatool-overlay-")) {
    return `ov${windowTitle.slice(-1)}`;
  }
  return windowTitle || pathOf(target);
}

async function listTargets() {
  const res = await fetch(`${HOST}/json`);
  const targets = await res.json();
  return targets.filter(
    (t) =>
      t.type === "page" &&
      // devtools:// is the inspector UI; chrome-extension:// is the React and
      // Redux devtools background pages, which are not app windows.
      !String(t.url).startsWith("devtools://") &&
      !String(t.url).startsWith("chrome-extension://")
  );
}

/** Render a CDP RemoteObject about as well as the DevTools console would. */
function renderArg(arg) {
  if (!arg) return "";
  if ("value" in arg) {
    return typeof arg.value === "string" ? arg.value : JSON.stringify(arg.value);
  }
  if (arg.unserializableValue) return String(arg.unserializableValue);
  if (arg.preview) {
    const props = (arg.preview.properties || [])
      .map((p) => `${p.name}: ${p.value}`)
      .join(", ");
    const name = arg.preview.description || arg.className || "Object";
    return arg.preview.overflow ? `${name} { ${props}, … }` : `${name} { ${props} }`;
  }
  return arg.description || arg.className || arg.type;
}

function connect(target, onEvent) {
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let nextId = 1;
  const pending = new Map();

  const send = (method, params) =>
    new Promise((resolve, reject) => {
      const id = nextId;
      nextId += 1;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params: params || {} }));
    });

  ws.addEventListener("message", (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
      return;
    }
    if (msg.method) onEvent(msg);
  });

  return { ws, send };
}

const opened = (conn) =>
  conn.ws.readyState === 1
    ? Promise.resolve()
    : new Promise((resolve, reject) => {
        conn.ws.addEventListener("open", resolve);
        conn.ws.addEventListener("error", reject);
      });

/** Ask the renderer which window it is. Falls back to the URL path. */
async function resolveLabel(conn, target) {
  try {
    const res = await conn.send("Runtime.evaluate", {
      expression: WINDOW_TITLE_EXPR,
      returnByValue: true,
    });
    return shortLabel(res.result && res.result.value, target);
  } catch {
    return shortLabel(null, target);
  }
}

/** Connect to every app window and label it, for one-shot commands. */
async function probeAll() {
  const targets = await listTargets();
  return Promise.all(
    targets.map(async (target) => {
      const conn = connect(target, () => {});
      await opened(conn);
      const label = await resolveLabel(conn, target);
      return { target, conn, label };
    })
  );
}

/**
 * Build-tooling chatter, echoed into every window and drowning the app's own
 * output. Dropped unless --all. These are all things the terminal running
 * `npm run start` already shows.
 */
const NOISE = [
  /^\[HMR\]/,
  /^\[WDS\]/,
  /Replace fill-available to stretch/,
  /start value has mixed support/,
  /There were more warnings in other files/,
  /Electron Security Warning/,
  /Download the React DevTools/,
];

const isNoise = (text) => NOISE.some((re) => re.test(text));

/** CDP timestamps are epoch ms; fall back to now for events that carry none. */
function stamp(ms) {
  return new Date(ms || Date.now()).toISOString().slice(11, 19);
}

function streamEvent(label, msg, showAll) {
  if (msg.method === "Runtime.consoleAPICalled") {
    const { type, args, timestamp } = msg.params;
    const text = (args || []).map(renderArg).join(" ");
    if (!showAll && isNoise(text)) return;
    const tag = type === "log" ? "" : ` ${type.toUpperCase()}`;
    console.log(`${stamp(timestamp)} [${label}]${tag} ${text}`);
    return;
  }

  if (msg.method === "Runtime.exceptionThrown") {
    const d = msg.params.exceptionDetails || {};
    const desc =
      (d.exception && (d.exception.description || d.exception.value)) || d.text;
    if (!showAll && isNoise(String(desc))) return;
    console.log(`${stamp(msg.params.timestamp)} [${label}] UNCAUGHT ${desc}`);
    return;
  }

  if (msg.method === "Log.entryAdded") {
    const e = msg.params.entry;
    // console.* already arrives via consoleAPICalled; don't print it twice.
    if (e.source === "console-api") return;
    if (!showAll && isNoise(e.text)) return;
    console.log(
      `${stamp(e.timestamp)} [${label}] ${e.level.toUpperCase()} (${
        e.source
      }) ${e.text}`
    );
  }
}

async function stream(showAll) {
  const attached = new Map();

  const sweep = async () => {
    let targets;
    try {
      targets = await listTargets();
    } catch {
      return; // app not up (yet, or any more) — just try again next tick
    }

    targets.forEach(async (target) => {
      if (attached.has(target.id)) return;
      // The label needs a round trip to the renderer, so hold it in a box the
      // event handler reads.
      const box = { label: pathOf(target) };
      const conn = connect(target, (msg) => streamEvent(box.label, msg, showAll));
      attached.set(target.id, conn);

      conn.ws.addEventListener("close", () => {
        attached.delete(target.id);
        console.log(`--- detached [${box.label}]`);
      });
      conn.ws.addEventListener("error", () => {
        attached.delete(target.id);
      });

      try {
        await opened(conn);
        box.label = await resolveLabel(conn, target);
        console.log(`--- attached [${box.label}] ${target.url}`);
        // Enabled only now, and deliberately after the label is known: these
        // replay the window's buffered console history immediately, which would
        // otherwise all land under the placeholder label.
        //
        // Runtime carries console.* and uncaught errors; Log carries the
        // browser's own messages (failed requests, CSP, deprecations).
        await conn.send("Runtime.enable");
        await conn.send("Log.enable");
      } catch {
        attached.delete(target.id);
      }
    });
  };

  await sweep();
  // Windows are created over several seconds at boot, and overlays come and go.
  setInterval(() => {
    // A watcher that dies on one odd target is worse than useless — it stops
    // collecting silently while the app keeps running.
    sweep().catch((e) => console.log(`--- sweep failed: ${e.message}`));
  }, POLL_MS);
  console.log(`--- watching ${HOST} (ctrl-c to stop)`);
}

async function evaluate(windowName, expression) {
  const probed = await probeAll();
  const wanted =
    probed.find((p) => p.label === (windowName || "main")) ||
    (windowName ? null : probed[0]);

  if (!wanted) {
    console.error(
      `No such window "${windowName}". Available: ${probed
        .map((p) => p.label)
        .join(", ")}`
    );
    probed.forEach((p) => p.conn.ws.close());
    process.exit(1);
  }

  probed.filter((p) => p !== wanted).forEach((p) => p.conn.ws.close());
  const { conn } = wanted;

  try {
    const result = await conn.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      // Lets the expression use variables the page declared, same as typing
      // into the DevTools console.
      includeCommandLineAPI: true,
    });
    if (result.exceptionDetails) {
      const d = result.exceptionDetails;
      console.error(
        (d.exception && (d.exception.description || d.exception.value)) || d.text
      );
      process.exit(1);
    }
    const value = result.result.value;
    console.log(
      typeof value === "string" ? value : JSON.stringify(value, null, 2)
    );
  } finally {
    conn.ws.close();
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (flag) => {
    const i = argv.indexOf(flag);
    return i === -1 ? null : argv[i + 1];
  };

  try {
    await fetch(`${HOST}/json/version`);
  } catch {
    console.error(
      `Nothing listening on ${HOST}.\n` +
        `Start the app with the port open:  MTGA_DEBUG_PORT=${PORT} npm run start`
    );
    process.exit(1);
  }

  if (argv.includes("--list")) {
    const probed = await probeAll();
    probed.forEach((p) => {
      console.log(`${p.label.padEnd(8)} ${p.target.url}`);
      p.conn.ws.close();
    });
    return;
  }

  const expression = arg("--eval");
  if (expression) {
    await evaluate(arg("--window"), expression);
    return;
  }

  await stream(argv.includes("--all"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
