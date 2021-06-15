import { useCallback, useEffect, useRef, useState } from "react";
import { Chances, compareCards, Deck } from "mtgatool-shared";

import {
  OVERLAY_FULL,
  OVERLAY_LOG,
  OVERLAY_SEEN,
} from "mtgatool-shared/dist/shared/constants";
import OverlayDeckList from "../components/OverlayDeckList";
import TopBar from "../components/TopBar";

import { ChannelMessage } from "../broadcastChannel/channelMessages";
import bcConnect from "../utils/bcConnect";
import getLocalSetting from "../utils/getLocalSetting";
import useDebounce from "../hooks/useDebounce";
import electron from "../utils/electron/electronWrapper";
import { OverlayUpdateMatchState } from "../background/store/types";
import { OverlaySettings, Settings } from "../common/defaultConfig";
import {
  WINDOW_OVERLAY_0,
  WINDOW_OVERLAY_1,
  WINDOW_OVERLAY_2,
  WINDOW_OVERLAY_3,
  WINDOW_OVERLAY_4,
} from "../types/app";
import postChannelMessage from "../broadcastChannel/postChannelMessage";

const titleToId: Record<string, number> = {
  [WINDOW_OVERLAY_0]: 0,
  [WINDOW_OVERLAY_1]: 1,
  [WINDOW_OVERLAY_2]: 2,
  [WINDOW_OVERLAY_3]: 3,
  [WINDOW_OVERLAY_4]: 4,
};

function getCurrentOverlayId(): number {
  const title = electron?.remote.getCurrentWindow().getTitle() || "";
  return titleToId[title] || 0;
}

export default function Overlay() {
  const [deck, setDeck] = useState<Deck>();
  const [settings, setSettings] = useState<OverlaySettings>();
  const [matchState, setMatchState] = useState<OverlayUpdateMatchState>();
  const [odds, setOdds] = useState<Chances>();
  const heightDivAdjustRef = useRef<HTMLDivElement>(null);

  const updateNewBounds = useCallback(() => {
    if (electron) {
      const window = electron.remote.getCurrentWindow();
      postChannelMessage({
        type: "OVERLAY_UPDATE_BOUNDS",
        value: { bounds: window.getBounds(), window: window.getTitle() },
      });
    }
  }, []);

  const deboucer = useDebounce(500);

  const channelMessageHandler = useCallback(
    (msg: MessageEvent<ChannelMessage>) => {
      if (msg.data.type === "UPSERT_GUN_CARDS") {
        window.cards = msg.data.value;
      }

      if (msg.data.type === "OVERLAY_UPDATE_SETTINGS") {
        const newSettings: OverlaySettings = (JSON.parse(
          getLocalSetting("settings")
        ) as Settings).overlays[getCurrentOverlayId()];

        setSettings({
          ...settings,
          ...newSettings,
          bounds: settings?.bounds || newSettings.bounds,
        });
      }

      if (msg.data.type === "OVERLAY_UPDATE") {
        setMatchState(msg.data.value);
      }
    },
    [settings]
  );

  useEffect(() => {
    const channel = bcConnect() as any;
    channel.onmessage = channelMessageHandler;

    if (electron) {
      electron.remote.getCurrentWindow().removeAllListeners();
      electron.remote
        .getCurrentWindow()
        .on("move", () => deboucer(updateNewBounds));
      electron.remote
        .getCurrentWindow()
        .on("resize", () => deboucer(updateNewBounds));
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

  if (electron && settings?.autosize && heightDivAdjustRef.current) {
    electron.remote.getCurrentWindow().setBounds({
      height: Math.ceil(heightDivAdjustRef.current.offsetHeight) + 24,
    });
  }

  let subTitle = deck?.getName() || "Deck";
  if (settings?.mode == OVERLAY_LOG) {
    subTitle = "Action Log";
  }

  return (
    <>
      {process.platform !== "linux" && <TopBar />}
      <div
        style={{
          backgroundColor: `rgba(0,0,0, ${settings?.alphaBack || 0})`,
          height: "-webkit-fill-available",
        }}
      >
        <div ref={heightDivAdjustRef} style={{ opacity: settings?.alpha || 0 }}>
          {deck && settings && (
            <OverlayDeckList
              deck={deck}
              settings={settings}
              subTitle={subTitle}
              cardOdds={odds}
              setOddsCallback={() => {
                //
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}
