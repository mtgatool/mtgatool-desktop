import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { OverlayUpdateMatchState } from "../background/store/types";
import { OverlaySettings } from "../common/defaultConfig";
import { OVERLAY_FULL, OVERLAY_SEEN } from "../constants";
import supabase from "../data/supabase";
import OverlayContent from "../overlay/OverlayContent";
import { InternalDraftv2 } from "../types";
import { DbDraftVote } from "../types/dbTypes";
import cardsDb from "../utils/cardsDb/cardsDbClient";
import compareCards from "../utils/compareCards";
import Deck from "../utils/mtga/deck";
import { ActionLogV2 } from "./action-log-v2/types";
import Section from "./ui/Section";

interface SharePayload {
  matchState?: OverlayUpdateMatchState;
  settings: OverlaySettings;
  actionLog?: ActionLogV2 | null;
  draftState?: InternalDraftv2;
  draftVotes?: Record<string, DbDraftVote>;
}

/**
 * Public live overlay viewer (app.mtgatool.com/live/<shareId>) — the page the
 * overlay QR points to, embeddable in OBS as a browser source. Polls the
 * `live_overlays` row the shared overlay upserts, and renders the SAME
 * OverlayContent (deck list, clock, action log or draft picks per the overlay's
 * mode/settings) so what a viewer sees is exactly what the overlay shows.
 * Deliberately unauthenticated: the shareId is an unguessable capability token
 * and this route mounts outside the login gate.
 */
export default function LiveShareView(): JSX.Element {
  const params = useParams<{ id: string }>();
  const [dbReady, setDbReady] = useState(false);
  const [payload, setPayload] = useState<SharePayload | null>(null);

  // Card names/art need the cards database; load it without any login.
  useEffect(() => {
    cardsDb
      .init()
      .catch(() => undefined)
      .finally(() => setDbReady(true));
  }, []);

  // Strip the themed app background so the whole page is transparent for OBS
  // (see .live-share-page in app.scss). Scoped to this route's lifetime.
  useEffect(() => {
    document.body.classList.add("live-share-page");
    return () => document.body.classList.remove("live-share-page");
  }, []);

  // Poll the shared overlay row over plain HTTP. Stateless GET — no socket to
  // keep alive, so it just works from any network/tab state. The publisher
  // upserts ~1/s, so a 1s poll tracks it closely enough for an OBS source.
  useEffect(() => {
    let cancelled = false;
    const poll = (): void => {
      supabase
        .from("live_overlays")
        .select("payload")
        .eq("share_id", params.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error) {
            // eslint-disable-next-line no-console
            console.warn(
              `[liveShare] poll ${params.id} failed:`,
              error.message
            );
            return;
          }
          if (data?.payload) setPayload(data.payload as SharePayload);
        });
    };
    poll();
    const iv = setInterval(poll, 1000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [params.id]);

  const matchState = payload?.matchState;
  const settings = payload?.settings;

  // Derive the displayed deck exactly like the overlay window does
  // (overlay/index.tsx): opponent's seen cards for OVERLAY_SEEN, full player
  // deck for OVERLAY_FULL, otherwise the cards-left list with draw odds. LOG /
  // DRAFT modes don't use `deck` (OverlayContent renders the log / picks).
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
    return {
      deck: shown,
      odds: matchState.playerCardsOdds,
      subTitle: shown.getName() || "Deck",
    };
  }, [matchState, settings]);

  if (!payload || !settings || !dbReady) {
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
            Waiting for live data… This page updates automatically while the
            sharer has overlay sharing enabled.
          </div>
        </Section>
      </div>
    );
  }

  // The backdrop defaults to transparent so an OBS browser source composites
  // the overlay over your scene; the sharer can opt into a flat colour
  // (settings.shareBackColor) from the overlay settings.
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
        <OverlayContent
          settings={settings}
          deck={deck}
          subTitle={subTitle}
          odds={odds}
          matchState={matchState}
          actionLog={payload.actionLog}
          draftState={payload.draftState}
          draftVotes={payload.draftVotes}
          shareControls={false}
        />
      </div>
    </div>
  );
}
