import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import logoBig from "../assets/images/logo_big.png";
import logoRound from "../assets/images/logo_round.png";
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

interface SharePayload {
  matchState?: OverlayUpdateMatchState;
  settings: OverlaySettings;
  actionLog?: ActionLogV2 | null;
  draftState?: InternalDraftv2;
  draftVotes?: Record<string, DbDraftVote>;
  matchInProgress?: boolean;
}

/**
 * How long without a write before the publisher is assumed gone.
 *
 * liveShare.ts re-writes the row every 3s while the overlay window is alive, so
 * silence means the window closed — which is what happens when a match ends.
 * Generous on purpose: a few missed beats (Chromium suspends these always-on-top
 * renderers aggressively) must not blank a deck mid-game. Lingering a few
 * seconds after a match is much the cheaper mistake.
 */
const STALE_MS = 15000;

/**
 * Shown before the first payload arrives and, when the sharer asks for it,
 * between matches.
 *
 * Anchored to the top rather than the middle: a browser source is usually far
 * taller than this block, and centring left the mark floating in the scene.
 */
function WaitingScreen(): JSX.Element {
  return (
    <div className="live-share-waiting">
      <div className="live-share-waiting-card">
        <img src={logoBig} alt="MTG Arena Tool" />
        <div className="live-share-waiting-text">Waiting for a deck…</div>
        <div className="live-share-waiting-link">mtgatool.com</div>
      </div>
    </div>
  );
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
  // When the row was last written, to notice the publisher going away.
  const [updatedAt, setUpdatedAt] = useState<number>(0);
  // Ticks so staleness is re-evaluated while nothing is arriving — the whole
  // point is to react to updates *stopping*, which no other state change marks.
  const [, tick] = useState(0);

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
        .select("payload, updated_at")
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
          if (data?.payload) {
            setPayload(data.payload as SharePayload);
            setUpdatedAt(
              data.updated_at ? new Date(data.updated_at).getTime() : 0
            );
          }
        });
    };
    poll();
    const iv = setInterval(poll, 1000);
    const age = setInterval(() => tick((n) => n + 1), 1000);
    return () => {
      cancelled = true;
      clearInterval(iv);
      clearInterval(age);
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

  // Between matches the last payload is still a perfectly valid deck, so it
  // would otherwise sit on the stream looking live until the next game. Two
  // signals, because neither covers the other: an overlay set to show always
  // keeps publishing with no match on, and one that closes at the end of a
  // match never gets to say so.
  //
  // Absent on configs written before this existed, and on payloads from an
  // older desktop build — on by default so those get the fixed behaviour too.
  // Only an explicit false turns it off, which is what the toggle writes.
  const hideWhenIdle = settings?.shareHideWhenIdle !== false;
  const stale = updatedAt > 0 && Date.now() - updatedAt > STALE_MS;
  const idle = hideWhenIdle && (payload?.matchInProgress === false || stale);

  if (!payload || !settings || !dbReady || idle) {
    return <WaitingScreen />;
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
      {/* Fills the browser source rather than sitting at the overlay window's
          320px. The card tiles lay out to whatever width they are given, and an
          OBS source is sized by whoever adds it — pinning a width here left the
          tiles squeezed into a column with the rest of the capture empty. */}
      <div
        className="live-share-shell"
        style={{
          width: "100%",
          backgroundColor: backColor,
          borderRadius: "4px",
          height: "fit-content",
        }}
      >
        {/* Sits over the deck's top-right corner. Absolute so it costs the
            overlay no layout — the sharer sized their scene around the deck,
            not around this. */}
        <img
          className="live-share-mark"
          src={logoRound}
          alt="MTG Arena Tool"
          title="MTG Arena Tool"
        />
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
