import isTauri from "./tauri/isTauri";

// Web `BroadcastChannel` does NOT propagate across separate Tauri (WebView2)
// windows — each window is an isolated webview. Everything else that "works"
// cross-window (collection, decks, match history) actually flows through shared
// storage (memory reads + IndexedDB), not the channel. The overlays are the one
// consumer that needs a real-time push from the background window, so in Tauri
// we back the channel with Tauri's event system, which does cross windows.
//
// The shim mimics the tiny slice of the BroadcastChannel API the app uses:
// a settable `onmessage` handler and `postMessage(msg)`.
const TAURI_BC_EVENT = "mtgatool-bc";

interface ChannelLike {
  onmessage: ((ev: { data: unknown }) => void) | null;
  postMessage: (msg: unknown) => void;
  close: () => void;
}

function createTauriChannel(): ChannelLike {
  const channel: ChannelLike = {
    onmessage: null,
    postMessage: () => {
      /* replaced once emit is ready; see below */
    },
    close: () => {
      /* no-op */
    },
  };

  let label: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let emitFn: ((event: string, payload: unknown) => Promise<void>) | null =
    null;
  const pending: unknown[] = [];

  const doEmit = (msg: unknown): void => {
    // Tag with our window label so we can drop our own echo (a global Tauri
    // emit is delivered to the sender too, unlike BroadcastChannel).
    if (emitFn) emitFn(TAURI_BC_EVENT, { __from: label, msg });
  };

  channel.postMessage = (msg: unknown): void => {
    if (emitFn && label !== null) doEmit(msg);
    else pending.push(msg);
  };

  (async (): Promise<void> => {
    try {
      const evt = await import("@tauri-apps/api/event");
      const win = await import("@tauri-apps/api/window");
      label = win.getCurrentWindow().label;
      emitFn = evt.emit;

      await evt.listen(TAURI_BC_EVENT, (event: { payload: unknown }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = (event.payload || {}) as any;
        if (p.__from === label) return; // ignore our own echo
        if (channel.onmessage) channel.onmessage({ data: p.msg });
      });

      // Flush anything posted before emit/listen were ready.
      pending.forEach((m) => doEmit(m));
      pending.length = 0;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[bcConnect] failed to init Tauri channel bridge:", e);
    }
  })();

  return channel;
}

export default function bcConnect() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let globalData = (window as any).backGlobalData;
  if (!globalData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalData = (window as any).globalData;
  }

  if (globalData.broadcastChannel) {
    return globalData.broadcastChannel;
  }

  const bc = isTauri()
    ? createTauriChannel()
    : new BroadcastChannel("mtgatool-channel");

  globalData.broadcastChannel = bc;
  return bc;
}
