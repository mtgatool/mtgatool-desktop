import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { OverlayUpdateMatchState } from "../background/store/types";
import { OverlaySettings } from "../common/defaultConfig";
import {
  OVERLAY_DRAFT,
  OVERLAY_FULL,
  OVERLAY_LOG,
  OVERLAY_SEEN,
} from "../constants";
import supabase from "../data/supabase";
import compareCards from "../utils/compareCards";
import { loadDbFromCache } from "../utils/database-wrapper";
import getLocalSetting from "../utils/getLocalSetting";
import Deck from "../utils/mtga/deck";
import OverlayDeckList from "./OverlayDeckList";
import Section from "./ui/Section";

interface SharePayload {
  matchState: OverlayUpdateMatchState;
  settings: OverlaySettings;
  overlayId: number;
  ts: number;
}

/**
 * Public live overlay viewer (app.mtgatool.com/live/<shareId>) — the page the
 * overlay QR points to, embeddable in OBS as a browser source. Subscribes to
 * the Supabase Realtime channel the desktop broadcasts on while that overlay
 * has sharing enabled, and renders THE SAME overlay component with the shared
 * overlay's own settings (mode, deck/sideboard/odds toggles...), so what you
 * share is what the overlay shows. Deliberately unauthenticated: the shareId
 * is an unguessable capability token and this route mounts outside the login
 * gate.
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

  // Strip the themed app background so the whole page is transparent for OBS
  // (see .live-share-page in app.scss). Scoped to this route's lifetime.
  useEffect(() => {
    document.body.classList.add("live-share-page");
    return () => document.body.classList.remove("live-share-page");
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`overlay-${params.id}`)
      .on("broadcast", { event: "overlay" }, (msg: any) => {
        if (msg?.payload?.matchState) {
          // Diagnostic: lets us confirm from the viewer console whether the
          // publisher keeps streaming. If these stop while the desktop overlay
          // keeps advancing, the stall is publisher-side.
          // eslint-disable-next-line no-console
          console.log(
            `[liveShare] recv overlay-${params.id} ts=${msg.payload.ts}`
          );
          setPayload(msg.payload as SharePayload);
        }
      })
      .subscribe((status: string) => {
        // eslint-disable-next-line no-console
        console.log(`[liveShare] viewer overlay-${params.id} ${status}`);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  const matchState = payload?.matchState;
  const settings = payload?.settings;

  // Derive the deck to display exactly like the overlay window does
  // (overlay/index.tsx): opponent's seen cards for OVERLAY_SEEN, full player
  // deck for OVERLAY_FULL, otherwise the cards-left list with draw odds.
  const { deck, odds, subTitle } = useMemo(() => {
    if (!matchState || !settings) {
      return { deck: undefined, odds: undefined, subTitle: "" };
    }
    if (settings.mode === OVERLAY_SEEN) {
      const oppCards = new Deck(matchState.oppCards);
      oppCards.setName(`${matchState.opponent.name}'s deck`);
      return { deck: oppCards, odds: undefined, subTitle: oppCards.getName() };
    }
    const playerCardsLeft = new Deck(matchState.playerCardsLeft);
    const playerDeck = new Deck(matchState.playerDeck);
    playerCardsLeft.sortMainboard(compareCards);
    playerCardsLeft.sortSideboard(compareCards);
    playerCardsLeft.getMainboard().removeZeros();
    playerCardsLeft.getSideboard().removeZeros();
    const shown = settings.mode === OVERLAY_FULL ? playerDeck : playerCardsLeft;
    // Debug: log exactly what this viewer will render (mode + mainboard), to
    // compare against the publisher's "[liveShare] publish … left=/deck=" line.
    const main = shown.getMainboard().get();
    const total = main.reduce((s: number, c: any) => s + (c.quantity || 0), 0);
    // eslint-disable-next-line no-console
    console.log(
      `[liveShare] render mode=${settings.mode} shown=${total} in ${main.length} ` +
        `[${main.map((c: any) => `${c.id}x${c.quantity}`).join(",")}]`
    );
    return {
      deck: shown,
      odds: matchState.playerCardsOdds,
      subTitle: shown.getName() || "Deck",
    };
  }, [matchState, settings]);

  const unsupportedMode =
    settings &&
    (settings.mode === OVERLAY_LOG || settings.mode === OVERLAY_DRAFT);

  if (!matchState || !settings || !dbReady || !deck || unsupportedMode) {
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
            {unsupportedMode
              ? "This overlay mode can't be shared yet — try a deck or odds overlay."
              : "Waiting for live match data… This page updates automatically while the sharer is in a match with overlay sharing enabled."}
          </div>
        </Section>
      </div>
    );
  }

  // Render the overlay itself: same component, same settings, fixed overlay
  // width. The backdrop defaults to transparent so an OBS browser source
  // composites the overlay over your scene; the sharer can opt into a flat
  // colour (settings.shareBackColor) from the overlay settings.
  const backColor = settings.shareBackColor || "transparent";
  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: "320px",
          backgroundColor: backColor,
          borderRadius: "4px",
          height: "fit-content",
        }}
      >
        <OverlayDeckList
          deck={deck}
          settings={settings}
          subTitle={subTitle}
          cardOdds={odds}
          setOddsCallback={() => {
            //
          }}
          shareControls={false}
        />
      </div>
    </div>
  );
}
