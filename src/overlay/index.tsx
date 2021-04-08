/* eslint-disable import/no-webpack-loader-syntax */

import { Chances, compareCards, Deck } from "mtgatool-shared";
import { LOGIN_OK, OVERLAY_MIXED } from "mtgatool-shared/dist/shared/constants";
import { useEffect, useState } from "react";

import { ChannelMessage } from "../broadcastChannel/channelMessages";
import DeckList from "../components/DeckList";
import TopBar from "../components/TopBar";
// import useTransparentFix from "../hooks/useTransparentFix";
import bcConnect from "../utils/bcConnect";

export default function Overlay() {
  // useTransparentFix();
  const [deck, setDeck] = useState<Deck>();
  const [odds, setOdds] = useState<Chances>();

  useEffect(() => {
    const channel = bcConnect() as any;
    channel.onmessage = (msg: MessageEvent<ChannelMessage>) => {
      if (msg.data.type === "OVERLAY_UPDATE") {
        // const oppCards = new Deck(msg.data.type.oppCards);
        const playerCardsLeft = new Deck(msg.data.value.playerCardsLeft);
        // const player.deck = new Deck(msg.data.type.player.deck);
        // const player.originalDeck = new Deck(msg.data.type.player.originalDeck);

        playerCardsLeft.sortMainboard(compareCards);
        playerCardsLeft.sortSideboard(compareCards);
        setOdds(msg.data.value.playerCardsOdds);
        setDeck(playerCardsLeft);
      }
    };
  });

  return (
    <>
      {process.platform !== "linux" && (
        <TopBar artist="" loginState={LOGIN_OK} offline={false} />
      )}
      <div style={{ backgroundColor: "rgba(0,0,0,0.25)", height: "100%" }}>
        {deck && (
          <DeckList
            deck={deck}
            settings={{
              alpha: 1,
              alphaBack: 1,
              autosize: true,
              bounds: {
                width: 1,
                height: 1,
                x: 1,
                y: 1,
              },
              clock: true,
              drawOdds: true,
              deck: true,
              lands: true,
              manaCurve: true,
              mode: OVERLAY_MIXED,
              ontop: true,
              show: true,
              showAlways: true,
              sideboard: true,
              title: true,
              top: true,
              typeCounts: true,
              collapsed: true,
            }}
            subTitle="subTitle"
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
