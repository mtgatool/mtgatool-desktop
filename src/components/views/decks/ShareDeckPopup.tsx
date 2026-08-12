import { MutableRefObject, useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import {
  getMyDeckShare,
  sharedDeckUrl,
  shareDeck,
  stopSharingDeck,
} from "../../../data/sharedDecks";
import reduxAction from "../../../redux/reduxAction";
import { StatsDeck } from "../../../types/dbTypes";
import copyToClipboard from "../../../utils/copyToClipboard";
import isElectron from "../../../utils/electron/isElectron";
import getPopupClass from "../../../utils/getPopupClass";
import PopupComponent from "../../PopupComponent";
import Button from "../../ui/Button";
import Checkbox from "../../ui/Checkbox";

interface ShareDeckPopupProps {
  /** Null until a deck asks to be shared; the popup stays mounted either
   * way so its open/close refs are always wired. */
  deck: StatsDeck | null;
  openFnRef: MutableRefObject<() => void>;
  closeFnRef: MutableRefObject<() => void>;
}

/**
 * The "make public" dialog. Sharing upserts a snapshot of the deck under a
 * stable capability token and puts the public URL on the clipboard; anyone
 * with the link can view the deck without an account. Stop sharing deletes
 * the row and the link dies with it.
 */
export default function ShareDeckPopup(props: ShareDeckPopupProps) {
  const { deck, openFnRef, closeFnRef } = props;
  const dispatch = useDispatch();
  const os = isElectron() ? process.platform : "";

  const [shareId, setShareId] = useState<string | null>(null);
  const [includeWinrate, setIncludeWinrate] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!deck?.id) return undefined;
    // Fully reset for the new deck — nothing of the previous share (link or
    // checkbox) may leak into it — and drop a stale answer if the deck
    // changes mid-fetch.
    setShareId(null);
    setIncludeWinrate(true);
    let cancelled = false;
    getMyDeckShare(deck.id).then((existing) => {
      if (cancelled || !existing) return;
      setShareId(existing.shareId);
      setIncludeWinrate(existing.includeWinrate);
    });
    return () => {
      cancelled = true;
    };
  }, [deck?.id]);

  const toast = useCallback(
    (text: string) => {
      reduxAction(dispatch, {
        type: "SET_POPUP",
        arg: { text, duration: 5000, time: new Date().getTime() },
      });
    },
    [dispatch]
  );

  const doShare = useCallback(() => {
    if (busy || !deck) return;
    setBusy(true);
    shareDeck(deck, includeWinrate).then((share) => {
      setBusy(false);
      if (!share) {
        toast("Could not share the deck — are you signed in?");
        return;
      }
      setShareId(share.shareId);
      copyToClipboard(sharedDeckUrl(share.shareId));
      toast("Public link copied to clipboard.");
    });
  }, [busy, deck, includeWinrate, toast]);

  const doStop = useCallback(() => {
    const deckId = deck?.id;
    if (busy || !deckId) return;
    setBusy(true);
    stopSharingDeck(deckId).then((ok) => {
      setBusy(false);
      if (ok) {
        setShareId(null);
        toast("The deck is no longer public.");
      }
    });
  }, [busy, deck, toast]);

  return (
    <PopupComponent
      open={false}
      className={getPopupClass(os)}
      width="520px"
      height="auto"
      openFnRef={openFnRef}
      closeFnRef={closeFnRef}
      persistent={false}
    >
      <div className="share-deck-popup">
        <div className="share-deck-title">Share this deck</div>
        <p>
          Anyone with the link can view the decklist — no account needed. The
          list is a snapshot: share again after editing to refresh it.
        </p>
        {shareId ? (
          <div className="share-deck-link-row">
            <input
              readOnly
              value={sharedDeckUrl(shareId)}
              onFocus={(e) => e.target.select()}
            />
            <div
              className="copy-button"
              title="Copy link"
              onClick={() => {
                copyToClipboard(sharedDeckUrl(shareId));
                toast("Public link copied to clipboard.");
              }}
            />
          </div>
        ) : null}
        <Checkbox
          text="Show my win rate with this deck"
          value={includeWinrate}
          callback={setIncludeWinrate}
        />
        <div className="share-deck-buttons">
          <Button
            text={shareId ? "Update & copy link" : "Share & copy link"}
            onClick={doShare}
            disabled={busy}
          />
          {shareId ? (
            <Button
              text="Stop sharing"
              className="button-simple-dark"
              onClick={doStop}
              disabled={busy}
            />
          ) : null}
        </div>
      </div>
    </PopupComponent>
  );
}
