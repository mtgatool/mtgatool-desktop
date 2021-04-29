import { useCallback, useEffect, useState } from "react";
import {
  Chances,
  compareCards,
  Deck,
  OverlaySettingsData,
} from "mtgatool-shared";
import { LOGIN_OK } from "mtgatool-shared/dist/shared/constants";

import DeckList from "../components/OverlayDeckList";
import TopBar from "../components/TopBar";

import { ChannelMessage } from "../broadcastChannel/channelMessages";
import bcConnect from "../utils/bcConnect";
import getLocalSetting from "../utils/getLocalSetting";
import setLocalSetting from "../utils/setLocalSetting";
import useDebounce from "../hooks/useDebounce";
import electron from "../utils/electron/electronWrapper";

export default function Overlay() {
  const [deck, setDeck] = useState<Deck>();
  const [settings, setSettings] = useState<OverlaySettingsData>();
  const [odds, setOdds] = useState<Chances>();

  const updateNewBounds = useCallback(() => {
    const oldSettings = JSON.parse(getLocalSetting("overlay_0"));
    const newSettings = electron
      ? {
          ...oldSettings,
          bounds: electron.remote.getCurrentWindow().getBounds(),
        }
      : {};
    setSettings(newSettings);
  }, []);

  const deboucer = useDebounce(500);

  useEffect(() => {
    const channel = bcConnect() as any;
    channel.onmessage = (msg: MessageEvent<ChannelMessage>) => {
      if (msg.data.type === "UPSERT_GUN_CARDS") {
        window.cards = msg.data.value;
      }

      if (msg.data.type === "OVERLAY_UPDATE") {
        // const oppCards = new Deck(msg.data.type.oppCards);
        const playerCardsLeft = new Deck(msg.data.value.playerCardsLeft);
        // const player.deck = new Deck(msg.data.type.player.deck);
        // const player.originalDeck = new Deck(msg.data.type.player.originalDeck);

        playerCardsLeft.sortMainboard(compareCards);
        playerCardsLeft.sortSideboard(compareCards);
        playerCardsLeft.getMainboard().removeZeros();
        playerCardsLeft.getSideboard().removeZeros();
        setOdds(msg.data.value.playerCardsOdds);
        setDeck(playerCardsLeft);
      }
    };

    setSettings(JSON.parse(getLocalSetting("overlay_0")));

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
    if (settings) {
      setLocalSetting("overlay_0", JSON.stringify(settings));
    }
  }, [settings]);

  return (
    <>
      {process.platform !== "linux" && (
        <TopBar artist="" loginState={LOGIN_OK} offline={false} />
      )}
      <div style={{ backgroundColor: "rgba(0,0,0,0.25)", height: "100%" }}>
        {deck && settings && (
          <DeckList
            deck={deck}
            settings={settings}
            subTitle={deck.getName()}
            cardOdds={odds}
            setOddsCallback={() => {
              //
            }}
          />
        )}
      </div>
    </>
  );
}
