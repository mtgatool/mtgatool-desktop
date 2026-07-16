import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { OverlayUpdateMatchState } from "../background/store/types";
import supabase from "../data/supabase";
import { loadDbFromCache } from "../utils/database-wrapper";
import { getCardArtCrop } from "../utils/getCardArtCrop";
import getEventPrettyName from "../utils/getEventPrettyName";
import getLocalSetting from "../utils/getLocalSetting";
import getPlayerNameWithoutSuffix from "../utils/getPlayerNameWithoutSuffix";
import Deck from "../utils/mtga/deck";
import DeckColorsBar from "./DeckColorsBar";
import Flex from "./Flex";
import ManaCost from "./ManaCost";
import Section from "./ui/Section";
import LiveMatchDeckList from "./views/livematch/LiveMatchDeckList";

interface SharePayload {
  matchState: OverlayUpdateMatchState;
  overlayId: number;
  ts: number;
}

/**
 * Public live overlay viewer (app.mtgatool.com/live/<shareId>) — the page the
 * overlay QR points to, embeddable in OBS as a browser source. Subscribes to
 * the Supabase Realtime channel the desktop broadcasts on while that overlay
 * has sharing enabled. Deliberately unauthenticated: the shareId is an
 * unguessable capability token, and this route mounts outside the login gate.
 */
export default function LiveShareView(): JSX.Element {
  const params = useParams<{ id: string }>();
  const [dbReady, setDbReady] = useState(false);
  const [payload, setPayload] = useState<SharePayload | null>(null);

  // Card names/art need the cards database; load it without any login.
  useEffect(() => {
    loadDbFromCache(getLocalSetting("lang") || "en")
      .catch(() => undefined)
      .finally(() => setDbReady(true));
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`overlay-${params.id}`)
      .on("broadcast", { event: "overlay" }, (msg: any) => {
        if (msg?.payload?.matchState) {
          setPayload(msg.payload as SharePayload);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  const matchState = payload?.matchState;

  if (!matchState || !dbReady) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Section
          style={{
            padding: "40px",
            flexDirection: "column",
            textAlign: "center",
            maxWidth: "420px",
          }}
        >
          <h2 style={{ marginBottom: "12px" }}>MTG Arena Tool — Live</h2>
          <div style={{ color: "var(--color-text-dark)", lineHeight: "22px" }}>
            Waiting for live match data… This page updates automatically while
            the sharer is in a match with overlay sharing enabled.
          </div>
        </Section>
      </div>
    );
  }

  const playerDeck = new Deck(matchState.playerDeck);

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <div
        className="matches-top"
        style={{
          backgroundImage: `url("${getCardArtCrop(playerDeck.tile)}")`,
        }}
      >
        <DeckColorsBar deck={playerDeck} />
        <div className="top-inner">
          <div className="flex-item">
            <div
              style={{
                lineHeight: "32px",
                color: "var(--color-text-hover)",
                textShadow: "3px 3px 6px #000000",
              }}
            >
              {playerDeck.getName()}
            </div>
          </div>
          <div className="flex-item">
            <ManaCost
              className="manaS20"
              colors={playerDeck.getColors().get()}
            />
          </div>
        </div>
      </div>
      <Section className="live-match-header">
        <Flex>
          <div className="match-player-name">
            vs {getPlayerNameWithoutSuffix(matchState.opponent.name)}
          </div>
        </Flex>
        <Flex>
          Game {matchState.gameInfo.gameNumber}, Turn{" "}
          {matchState.turnInfo.turnNumber}
        </Flex>
        <Flex>{matchState.turnInfo.phase?.replace("Phase_", "")} Phase</Flex>
        <Flex>{getEventPrettyName(matchState.eventId)}</Flex>
      </Section>
      <LiveMatchDeckList matchState={matchState} />
    </div>
  );
}
