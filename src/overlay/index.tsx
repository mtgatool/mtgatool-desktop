import { BrowserWindow } from "electron";
import { Chances, compareCards, Deck, InternalDraftv2 } from "mtgatool-shared";
import {
  OVERLAY_DRAFT,
  OVERLAY_FULL,
  OVERLAY_LOG,
  OVERLAY_SEEN,
} from "mtgatool-shared/dist/shared/constants";
import { useCallback, useEffect, useRef, useState } from "react";

import { OverlayUpdateMatchState } from "../background/store/types";
import { ChannelMessage } from "../broadcastChannel/channelMessages";
import postChannelMessage from "../broadcastChannel/postChannelMessage";
import { OverlaySettings, Settings } from "../common/defaultConfig";
import { overlayTitleToId } from "../common/maps";
import ActionLog from "../components/ActionLog";
import OverlayDeckList from "../components/OverlayDeckList";
import TopBar from "../components/TopBar";
import useDebounce from "../hooks/useDebounce";
import { DbDraftVote } from "../types/dbTypes";
import bcConnect from "../utils/bcConnect";
import remote from "../utils/electron/remoteWrapper";
import getLocalSetting from "../utils/getLocalSetting";
import getPlayerNameWithoutSuffix from "../utils/getPlayerNameWithoutSuffix";
import Clock from "./Clock";
import DraftOverlay from "./DraftOverlay";

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
  const [actionLog, setActionLog] = useState<string>("");
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
          {settings && settings.mode === OVERLAY_LOG && (
            <ActionLog logStr={actionLog} />
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
