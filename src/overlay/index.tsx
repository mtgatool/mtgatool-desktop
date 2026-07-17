import { BrowserWindow } from "electron";
import { useCallback, useEffect, useRef, useState } from "react";

import { OverlayUpdateMatchState } from "../background/store/types";
import { ChannelMessage } from "../broadcastChannel/channelMessages";
import postChannelMessage from "../broadcastChannel/postChannelMessage";
import { OverlaySettings, Settings } from "../common/defaultConfig";
import { overlayTitleToId } from "../common/maps";
import { ActionLogV2 } from "../components/action-log-v2/types";
import TopBar from "../components/TopBar";
import {
  OVERLAY_DRAFT,
  OVERLAY_FULL,
  OVERLAY_LOG,
  OVERLAY_SEEN,
} from "../constants";
import {
  OverlaySharePayload,
  publishOverlayShare,
  stopOverlayShare,
} from "../data/liveShare";
import useDebounce from "../hooks/useDebounce";
import { InternalDraftv2 } from "../types";
import Chances from "../types/chances";
import { DbDraftVote } from "../types/dbTypes";
import bcConnect from "../utils/bcConnect";
import compareCards from "../utils/compareCards";
import remote from "../utils/electron/remoteWrapper";
import getLocalSetting from "../utils/getLocalSetting";
import Deck from "../utils/mtga/deck";
import OverlayContent from "./OverlayContent";

function getCurrentOverlayId(): number {
  const title = remote.getCurrentWindow().getTitle() || "";
  return overlayTitleToId[title] || 0;
}

export default function Overlay() {
  const [deck, setDeck] = useState<Deck>();
  const [settings, setSettings] = useState<OverlaySettings>();
  const [matchState, setMatchState] = useState<OverlayUpdateMatchState>();
  const [draftState, setDraftState] = useState<InternalDraftv2>();
  const [draftVotes, setDraftVotes] = useState<Record<string, DbDraftVote>>({});
  const [actionLog, setActionLog] = useState<ActionLogV2 | null>(null);
  const [odds, setOdds] = useState<Chances>();
  const heightDivAdjustRef = useRef<HTMLDivElement>(null);

  const allSettings = JSON.parse(getLocalSetting("settings")) as Settings;

  const updateNewBounds = useCallback(() => {
    if (remote) {
      const window = remote.getCurrentWindow() as BrowserWindow;
      postChannelMessage({
        type: "OVERLAY_UPDATE_BOUNDS",
        value: { bounds: window.getBounds(), window: window.getTitle() },
      });
    }
  }, []);

  const deboucer = useDebounce(500);

  const closeOverlay = useCallback(() => {
    if (remote) {
      const window = remote.getCurrentWindow() as BrowserWindow;
      postChannelMessage({
        type: "OVERLAY_SET_SETTINGS",
        value: { settings: { show: false }, window: window.getTitle() },
      });
    }
  }, []);

  const channelMessageHandler = useCallback(
    (msg: MessageEvent<ChannelMessage>) => {
      if (msg.data.type === "UPSERT_DB_CARDS") {
        window.cards = msg.data.value;
      }

      if (msg.data.type === "OVERLAY_UPDATE_SETTINGS") {
        const newSettings: OverlaySettings = (
          JSON.parse(getLocalSetting("settings")) as Settings
        ).overlays[getCurrentOverlayId()];

        setSettings({
          ...settings,
          ...newSettings,
          bounds: settings?.bounds || newSettings.bounds,
        });
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
    // if (electron) {
    //   const { setIgnoreMouseEvents } = remote.getCurrentWindow();
    //   setIgnoreMouseEvents(false);
    // }

    const channel = bcConnect() as any;
    channel.onmessage = channelMessageHandler;

    if (remote) {
      remote.getCurrentWindow().removeAllListeners();
      remote.getCurrentWindow().on("move", () => deboucer(updateNewBounds));
      remote.getCurrentWindow().on("resize", () => deboucer(updateNewBounds));
    }
  }, [deboucer]);

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

  // Live-share: while this overlay has sharing enabled, publish its state to
  // its own Realtime channel. Runs here (the visible overlay window) rather
  // than the hidden background window so the socket isn't throttled. Only the
  // data the current mode needs is sent, to keep payloads small.
  useEffect(() => {
    const shareId = settings?.shareId;
    if (!shareId || !settings?.shareEnabled) return;
    // Nothing to share yet.
    if (!matchState && !draftState && !actionLog) return;
    const payload: OverlaySharePayload = { matchState, settings };
    if (settings.mode === OVERLAY_LOG) payload.actionLog = actionLog;
    if (settings.mode === OVERLAY_DRAFT) {
      payload.draftState = draftState;
      payload.draftVotes = draftVotes;
    }
    publishOverlayShare(shareId, payload);
  }, [settings, matchState, actionLog, draftState, draftVotes]);

  // Tear the channel down when sharing is turned off, the shareId changes, or
  // the window unmounts — but NOT on every state tick (deps are the primitives
  // only), so the persistent channel survives normal updates.
  useEffect(() => {
    const shareId = settings?.shareId;
    if (shareId && !settings?.shareEnabled) stopOverlayShare(shareId);
    return () => {
      if (shareId) stopOverlayShare(shareId);
    };
  }, [settings?.shareId, settings?.shareEnabled]);

  if (remote && settings?.autosize && heightDivAdjustRef.current) {
    remote.getCurrentWindow().setBounds({
      // 24px topbar
      // 12px margin
      height:
        Math.ceil(heightDivAdjustRef.current.offsetHeight) +
        24 +
        (allSettings.overlaysTransparency ? 12 : 0),
    });
  }

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
          {settings && (
            <OverlayContent
              settings={settings}
              deck={deck}
              subTitle={subTitle}
              odds={odds}
              matchState={matchState}
              actionLog={actionLog}
              draftState={draftState}
              draftVotes={draftVotes}
            />
          )}
        </div>
      </div>
    </div>
  );
}
