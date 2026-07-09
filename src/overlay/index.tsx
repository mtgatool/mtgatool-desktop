import { PhysicalSize } from "@tauri-apps/api/dpi";
import { useCallback, useEffect, useRef, useState } from "react";

import { OverlayUpdateMatchState } from "../background/store/types";
import { ChannelMessage } from "../broadcastChannel/channelMessages";
import postChannelMessage from "../broadcastChannel/postChannelMessage";
import { OverlaySettings, Settings } from "../common/defaultConfig";
import ActionLog from "../components/action-log-v2";
import { ActionLogV2 } from "../components/action-log-v2/types";
import OverlayDeckList from "../components/OverlayDeckList";
import TopBar from "../components/TopBar";
import {
  OVERLAY_DRAFT,
  OVERLAY_FULL,
  OVERLAY_LOG,
  OVERLAY_SEEN,
} from "../constants";
import useDebounce from "../hooks/useDebounce";
import { InternalDraftv2 } from "../types";
import { getOverlayIndexFromLabel } from "../types/app";
import Chances from "../types/chances";
import { DbDraftVote } from "../types/dbTypes";
import bcConnect from "../utils/bcConnect";
import compareCards from "../utils/compareCards";
import getLocalSetting from "../utils/getLocalSetting";
import getPlayerNameWithoutSuffix from "../utils/getPlayerNameWithoutSuffix";
import Deck from "../utils/mtga/deck";
import isTauri from "../utils/tauri/isTauri";
import Clock from "./Clock";
import DraftOverlay from "./DraftOverlay";

// Reliable per-window label from Tauri's injected metadata (the old
// window.__TAURI__.window.appWindow path returned "main" for every window).
function currentLabel(): string {
  if (typeof window === "undefined") return "";
  try {
    // Tauri v2: the current window label is read synchronously via
    // getCurrentWindow(). The old __TAURI_METADATA__ global is v1-only and is
    // undefined in v2, which made every overlay resolve to "" -> wrong id ->
    // no settings -> opacity 0 -> a blank overlay.
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const { getCurrentWindow } = require("@tauri-apps/api/window");
    return getCurrentWindow().label || "";
  } catch {
    return "";
  }
}

// Get current overlay ID from Tauri window label
function getCurrentOverlayId(): number {
  if (isTauri()) {
    return getOverlayIndexFromLabel(currentLabel());
  }
  return 0;
}

// Get current window bounds in Tauri
async function getCurrentWindowBounds(): Promise<{
  x: number;
  y: number;
  width: number;
  height: number;
} | null> {
  if (!isTauri()) return null;
  try {
    const appWindow = (
      await import("@tauri-apps/api/window")
    ).getCurrentWindow();
    const position = await appWindow.outerPosition();
    const size = await appWindow.outerSize();
    return {
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
    };
  } catch {
    return null;
  }
}

// Get current window label in Tauri
function getCurrentWindowLabel(): string {
  if (isTauri()) {
    return currentLabel();
  }
  return "";
}

// Set window height in Tauri
async function setWindowHeight(height: number): Promise<void> {
  if (!isTauri()) return;
  try {
    const appWindow = (
      await import("@tauri-apps/api/window")
    ).getCurrentWindow();
    const size = await appWindow.outerSize();
    await appWindow.setSize(new PhysicalSize(size.width, Math.ceil(height)));
  } catch (e) {
    console.error("Failed to set window height:", e);
  }
}

export default function Overlay() {
  const [deck, setDeck] = useState<Deck>();
  // Initialize from shared localStorage on mount instead of waiting for an
  // OVERLAY_UPDATE_SETTINGS broadcast — that message is sent as the window is
  // being created, so a freshly-spawned overlay misses it and would otherwise
  // render blank/at defaults until the next settings change (e.g. a log update).
  const [settings, setSettings] = useState<OverlaySettings | undefined>(() => {
    try {
      const all = JSON.parse(getLocalSetting("settings")) as Settings;
      return all.overlays[getCurrentOverlayId()];
    } catch {
      return undefined;
    }
  });
  const [matchState, setMatchState] = useState<OverlayUpdateMatchState>();
  const [draftState, setDraftState] = useState<InternalDraftv2>();
  const [draftVotes, setDraftVotes] = useState<Record<string, DbDraftVote>>({});
  const [actionLog, setActionLog] = useState<ActionLogV2 | null>(null);
  const [odds, setOdds] = useState<Chances>();
  const heightDivAdjustRef = useRef<HTMLDivElement>(null);
  // Last height we actually pushed to the window. Autosize must be idempotent:
  // resizing the window fires onResized → saves bounds → settings change →
  // OVERLAY_UPDATE_SETTINGS → re-render → autosize again. Only resize when the
  // height truly changed, so the loop settles instead of flickering forever.
  const lastHeightRef = useRef(0);

  const allSettings = JSON.parse(getLocalSetting("settings")) as Settings;

  const updateNewBounds = useCallback(async () => {
    const bounds = await getCurrentWindowBounds();
    const label = getCurrentWindowLabel();
    if (bounds && label) {
      postChannelMessage({
        type: "OVERLAY_UPDATE_BOUNDS",
        value: { bounds, window: label },
      });
    }
  }, []);

  const deboucer = useDebounce(500);

  const closeOverlay = useCallback(() => {
    const label = getCurrentWindowLabel();
    if (label) {
      postChannelMessage({
        type: "OVERLAY_SET_SETTINGS",
        value: { settings: { show: false }, window: label },
      });
    }
  }, []);

  const channelMessageHandler = useCallback(
    (msg: MessageEvent<ChannelMessage>) => {
      if (msg.data.type === "UPSERT_DB_CARDS") {
        window.cards = msg.data.value;
      }

      if (msg.data.type === "OVERLAY_UPDATE_SETTINGS") {
        const newSettings: OverlaySettings | undefined = (
          JSON.parse(getLocalSetting("settings")) as Settings
        ).overlays[getCurrentOverlayId()];

        if (newSettings) {
          setSettings({
            ...settings,
            ...newSettings,
            bounds: settings?.bounds || newSettings.bounds,
          });
        }
      }

      if (msg.data.type === "OVERLAY_UPDATE") {
        setMatchState(msg.data.value);
      }

      if (msg.data.type === "DRAFT_VOTES") {
        setDraftVotes(msg.data.value);
      }

      if (msg.data.type === "DRAFT_STATUS") {
        setDraftState(msg.data.value);
      }

      if (msg.data.type === "ACTION_LOG") {
        setActionLog(msg.data.value);
      }
    },
    [settings]
  );

  useEffect(() => {
    const channel = bcConnect() as BroadcastChannel;
    channel.onmessage = channelMessageHandler;

    // Set up Tauri window event listeners
    let unlistenMove: (() => void) | undefined;
    let unlistenResize: (() => void) | undefined;

    if (isTauri()) {
      import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
        const appWindow = getCurrentWindow();
        appWindow
          .onMoved(() => deboucer(updateNewBounds))
          .then((unlisten) => {
            unlistenMove = unlisten;
          });
        appWindow
          .onResized(() => deboucer(updateNewBounds))
          .then((unlisten) => {
            unlistenResize = unlisten;
          });
      });
    }

    return () => {
      unlistenMove?.();
      unlistenResize?.();
    };
  }, [deboucer, channelMessageHandler, updateNewBounds]);

  useEffect(() => {
    if (matchState && settings) {
      if (settings.mode === OVERLAY_SEEN) {
        const oppCards = new Deck(matchState.oppCards);
        oppCards.setName(`${matchState.opponent.name}'s deck`);
        setDeck(oppCards);
      } else {
        // const oppCards = new Deck(matchState.oppCards);
        const playerCardsLeft = new Deck(matchState.playerCardsLeft);
        const playerDeck = new Deck(matchState.playerDeck);
        // const player.originalDeck = new Deck(matchState.player.originalDeck);

        playerCardsLeft.sortMainboard(compareCards);
        playerCardsLeft.sortSideboard(compareCards);
        playerCardsLeft.getMainboard().removeZeros();
        playerCardsLeft.getSideboard().removeZeros();
        setOdds(matchState.playerCardsOdds);
        if (settings.mode == OVERLAY_FULL) {
          setDeck(playerDeck);
        } else {
          setDeck(playerCardsLeft);
        }
      }
    }
  }, [settings, matchState]);

  // Handle autosize for Tauri. Re-measure whenever the rendered content
  // changes (deck, match, odds, action log, draft), not just when the setting
  // toggles — otherwise the window never grows to fit the loaded deck.
  useEffect(() => {
    if (settings?.autosize && heightDivAdjustRef.current) {
      // 24px topbar
      // 12px margin
      const height =
        Math.ceil(heightDivAdjustRef.current.offsetHeight) +
        24 +
        (allSettings.overlaysTransparency ? 12 : 0);
      // Idempotent: skip if the height hasn't meaningfully changed, otherwise
      // the resize → bounds-save → settings → autosize loop never settles.
      if (Math.abs(height - lastHeightRef.current) > 2) {
        lastHeightRef.current = height;
        setWindowHeight(height);
      }
    }
  }, [
    settings,
    allSettings.overlaysTransparency,
    deck,
    matchState,
    odds,
    actionLog,
    draftState,
  ]);

  let subTitle = deck?.getName() || "Deck";
  if (settings?.mode == OVERLAY_LOG) {
    subTitle = "Action Log";
  }

  return (
    <div
      className="click-on"
      style={
        allSettings.overlaysTransparency
          ? {
              padding: "6px",
              height: settings?.mode == OVERLAY_LOG ? "calc(100% - 12px)" : "",
              // backgroundColor: `rgba(0,0,0,0.1)`,
            }
          : {
              backgroundColor: `#0d0d0f`,
              height: "100%",
            }
      }
    >
      <TopBar closeCallback={closeOverlay} />
      <div
        style={{
          backgroundColor: `rgba(0,0,0, ${
            allSettings.overlaysTransparency ? settings?.alphaBack || 0 : 0
          })`,
          height: "100%",
          overflow: settings?.mode === OVERLAY_LOG ? "auto" : "",
        }}
      >
        <div ref={heightDivAdjustRef} style={{ opacity: settings?.alpha || 0 }}>
          {settings && settings.mode === OVERLAY_DRAFT && draftState && (
            <DraftOverlay state={draftState} votes={draftVotes} />
          )}
          {deck && settings && settings.mode !== OVERLAY_LOG && (
            <OverlayDeckList
              matchId={matchState?.matchId || ""}
              deck={deck}
              settings={settings}
              subTitle={subTitle}
              cardOdds={odds}
              setOddsCallback={() => {
                //
              }}
            />
          )}
          {settings && settings.mode === OVERLAY_LOG && actionLog && (
            <ActionLog actionLog={actionLog} />
          )}
          {settings &&
            !!settings.clock &&
            matchState &&
            !settings.collapsed && (
              <Clock
                matchBeginTime={new Date(matchState.beginTime)}
                oppName={getPlayerNameWithoutSuffix(
                  matchState.opponent.name || ""
                )}
                playerSeat={matchState.player ? matchState.player.seat : 1}
                priorityTimers={matchState.priorityTimers}
                turnPriority={matchState.currentPriority}
              />
            )}
        </div>
      </div>
    </div>
  );
}
