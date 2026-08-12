import { useEffect, useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";

import logoBig from "../assets/images/logo_big.png";
import { DEFAULT_AVATAR, DEFAULT_TILE } from "../constants";
import { fetchSharedDeck, SharedDeckPayload } from "../data/sharedDecks";
import { useCards } from "../hooks/useCard";
import { useCardArtCrop } from "../hooks/useCardImage";
import cardsDb from "../utils/cardsDb/cardsDbClient";
import Colors from "../utils/mtga/colors";
import Deck from "../utils/mtga/deck";
import openExternal from "../utils/openExternal";
import DeckColorsBar from "./DeckColorsBar";
import ManaCost from "./ManaCost";
import PublicDeckDetails from "./PublicDeckDetails";
import SupporterBadge from "./SupporterBadge";
import PlayerMatchesSection from "./views/profile/PlayerMatchesSection";

/**
 * Public shared-deck page (app.mtgatool.com/share/deck/<token>) — what a
 * "make public" link resolves to. Same layout as the in-app deck view minus
 * anything personal to a viewer or owner: no deck changes, no card winrates,
 * no crafting cost. Deliberately unauthenticated, like /live/:id — the token
 * is an unguessable capability and this route mounts outside the login gate.
 */
export default function SharedDeckView(): JSX.Element {
  const params = useParams<{ id: string }>();
  const history = useHistory();
  const [dbReady, setDbReady] = useState(false);
  const [dbFailed, setDbFailed] = useState(false);
  const [payload, setPayload] = useState<SharedDeckPayload | null>(null);
  const [missing, setMissing] = useState(false);

  // Card names/art need the cards database; load it without any login. A
  // failure must surface — otherwise the page sits on "Loading" forever.
  useEffect(() => {
    cardsDb
      .init()
      .then((ready) => (ready ? setDbReady(true) : setDbFailed(true)))
      .catch(() => setDbFailed(true));
  }, []);

  useEffect(() => {
    // Reset for the new token, and ignore a slow answer for the previous one.
    setPayload(null);
    setMissing(false);
    let cancelled = false;
    fetchSharedDeck(params.id).then((data) => {
      if (cancelled) return;
      if (data) setPayload(data);
      else setMissing(true);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const snapshot = payload?.deck;

  // The curve/types/colors charts read cards synchronously from the lookup
  // cache, which is empty on a cold public page — they rendered blank until
  // something else happened to fetch the cards. Prefetch every id and rebuild
  // the deck once they land (same fix as the Home top decks).
  const allIds = useMemo(() => {
    const ids = new Set<number>();
    (snapshot?.mainDeck || []).forEach((c) => ids.add(c.id));
    (snapshot?.sideboard || []).forEach((c) => ids.add(c.id));
    (snapshot?.commanders || []).forEach((c) => ids.add(c.id));
    (snapshot?.companions || []).forEach((c) => ids.add(c.id));
    return [...ids];
  }, [snapshot]);
  const resolvedCards = useCards(allIds);

  const deck = useMemo(() => {
    const d = new Deck(
      {
        commandZoneGRPIds: snapshot?.commanders?.map((c) => c.id),
        companionGRPId: snapshot?.companions?.map((c) => c.id)[0],
      },
      snapshot?.mainDeck || [],
      snapshot?.sideboard || []
    );
    d.setName(snapshot?.name || "Deck");
    d.tile = snapshot?.deckTileId || DEFAULT_TILE;
    return d;
    // resolvedCards is the point: the charts below read from the card cache,
    // which is only warm once these lookups come back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, resolvedCards]);

  const deckArt = useCardArtCrop(snapshot?.deckTileId || DEFAULT_TILE);

  if (missing) {
    return (
      <div className="shared-deck-missing">
        <img src={logoBig} alt="MTG Arena Tool" />
        <div>This deck is no longer shared.</div>
        <div
          className="shared-deck-cta"
          onClick={() => openExternal("https://mtgatool.com")}
        >
          mtgatool.com
        </div>
      </div>
    );
  }

  if (dbFailed) {
    return (
      <div className="shared-deck-missing">
        <img src={logoBig} alt="MTG Arena Tool" />
        <div>Could not load the card database — try reloading the page.</div>
      </div>
    );
  }

  if (!payload || !dbReady || !snapshot) {
    return <div className="shared-deck-missing">Loading deck…</div>;
  }

  const { owner } = payload;
  const ownerProfile = owner?.username || null;
  const ownerName = owner?.username || "A Planeswalker";
  const wr = payload.winrate;
  const games = wr ? wr.wins + wr.losses : 0;
  const showRecord = !!wr && games > 0;

  return (
    <div className="shared-deck-page">
      <div className="shared-deck-content">
        <div
          className="decks-top"
          style={{ backgroundImage: `url(${deckArt})` }}
        >
          <DeckColorsBar deck={deck} />
          <div className="top-inner">
            <div className="flex-item">
              <div
                className="shared-deck-avatar"
                style={{
                  backgroundImage: `url(${
                    owner?.avatar_url || DEFAULT_AVATAR
                  })`,
                }}
              />
              <div className="shared-deck-title">
                <div className="shared-deck-name">{snapshot.name}</div>
                <div
                  className={`shared-deck-owner${
                    ownerProfile ? " has-profile" : ""
                  }`}
                  onClick={
                    ownerProfile
                      ? (): void =>
                          history.push(
                            `/profile/${encodeURIComponent(ownerProfile)}`
                          )
                      : undefined
                  }
                >
                  by {ownerName}
                  {owner && owner.supporter_tier > 0 ? (
                    <SupporterBadge tier={owner.supporter_tier} />
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex-item">
              <ManaCost
                className="mana-s20"
                colors={new Colors().addFromBits(snapshot.colors || 0).get()}
              />
            </div>
          </div>
        </div>

        <PublicDeckDetails
          deck={deck}
          showWildcards={false}
          recordSlot={
            showRecord && wr ? (
              <div
                className="shared-deck-record"
                title={`${wr.wins} wins, ${wr.losses} losses`}
              >
                <span className="record">{`${wr.wins}-${wr.losses}`}</span>
                <span
                  className="percent"
                  style={{
                    color:
                      wr.wins / games >= 0.5
                        ? "var(--color-g)"
                        : "var(--color-r)",
                  }}
                >
                  {`${((wr.wins / games) * 100).toFixed(0)}%`}
                </span>
                <span className="record-label">win rate</span>
              </div>
            ) : undefined
          }
        />

        {/* The deck's latest matches, when the owner is public. Same
            component as the profile pages: last five for everyone, the rest
            behind the Patreon pitch. */}
        {owner?.username && payload.deck_id ? (
          <PlayerMatchesSection
            id={owner.username}
            deckId={payload.deck_id}
            title="Recent matches with this deck"
          />
        ) : null}

        <div
          className="shared-deck-footer"
          onClick={() => openExternal("https://mtgatool.com")}
        >
          Tracked with <b>MTG Arena Tool</b> — free deck tracker for MTG Arena
        </div>
      </div>
    </div>
  );
}
