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
  // Seed from localStorage on mount. A close/reopen destroys and recreates the
  // overlay window, which mounts too late to catch the one-off
  // OVERLAY_UPDATE_SETTINGS broadcast that fired when it was reopened — so
  // without this the recreated overlay would sit with undefined settings
  // (blank, and never publishing its live share) until the user changed a
  // setting. OVERLAY_UPDATE_SETTINGS still keeps it in sync afterwards.
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
        const resolvedId = getCurrentOverlayId();
        const newSettings: OverlaySettings = (
          JSON.parse(getLocalSetting("settings")) as Settings
        ).overlays[resolvedId];

        // eslint-disable-next-line no-console
        console.log(
          `[liveShare] settings update: id=${resolvedId} title="${remote
            ?.getCurrentWindow()
            .getTitle()}" shareEnabled=${
            newSettings?.shareEnabled
          } shareId=${newSettings?.shareId?.slice(0, 8)}`
        );

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

  // Live-share: while this overlay has sharing enabled, upsert its state to the
  // live_overlays row on each change (throttled in publishOverlayShare). Only
  // the data the current mode needs is sent, to keep payloads small.
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

  // Stop sharing ONLY when the user explicitly disables it (shareEnabled ->
  // false). Deliberately no effect-cleanup teardown: React fires cleanups on
  // unmount/remount and whenever these deps change (autosize resizes and
  // settings churn cause plenty of those mid-match), which would spuriously
  // delete the row and clear the keepalive. The keepalive lives in module state
  // (liveShare.ts), so it survives component remounts on its own; when the
  // window actually closes, its JS context — and the interval with it — is torn
  // down anyway.
  useEffect(() => {
    const shareId = settings?.shareId;
    if (shareId && settings && !settings.shareEnabled) {
      stopOverlayShare(shareId);
    }
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
