import { useRef, useState } from "react";

import { ReactComponent as CameraIcon } from "../../assets/images/svg/camera-solid.svg";
import { ReactComponent as Close } from "../../assets/images/svg/close.svg";
import { useCardArtCrop } from "../../hooks/useCardImage";
import Deck from "../../utils/mtga/deck";
import saveNodeAsImage, { imageFileName } from "../../utils/saveNodeAsImage";
import DeckColorsBar from "../DeckColorsBar";
import DeckList from "../DeckList";
import ManaCost from "../ManaCost";

interface DeckViewPopupProps {
  onClose: () => void;
  deck: Deck;
}

export default function DeckViewPopup(props: DeckViewPopupProps) {
  const { onClose, deck } = props;
  const tileArt = useCardArtCrop(deck?.tile);

  // Wraps only the deck itself, so the buttons floating over the popup do not
  // end up in the picture.
  const shotRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const saveImage = async (): Promise<void> => {
    if (!shotRef.current || saving) return;
    setSaving(true);
    setFailed(false);
    try {
      await saveNodeAsImage(
        shotRef.current,
        imageFileName(deck?.getName() || "deck")
      );
    } catch (e) {
      setFailed(true);
    }
    setSaving(false);
  };

  return (
    <>
      <div className="close-button" onClick={onClose}>
        <Close fill="var(--color-text-hover)" />
      </div>
      {/* Outside the captured node on purpose — a "save" button inside the
          picture would be saved along with it. */}
      <div className="deck-popup-actions">
        <button
          type="button"
          className="deck-popup-save"
          onClick={saveImage}
          disabled={saving}
          title="Save this deck as an image"
        >
          <CameraIcon fill="currentColor" />
          {saving ? "Rendering…" : "Save as image"}
        </button>
      </div>

      <div
        ref={shotRef}
        style={{
          margin: "0 auto 16px auto",
          maxWidth: "480px",
          width: "480px",
        }}
      >
        <div
          className="decks-top small"
          style={{
            backgroundImage: deck ? `url(${tileArt})` : "",
          }}
        >
          <DeckColorsBar deck={deck} />
          <div className="top-inner">
            <div
              style={{
                lineHeight: "32px",
                color: "var(--color-text-hover)",
                textShadow: "3px 3px 6px #000000",
              }}
            >
              {deck?.getName() || "Deck"}
            </div>
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
              }}
            >
              <ManaCost className="mana-s20" colors={deck?.colors.get()} />
            </div>
          </div>
        </div>
        <DeckList deck={deck} showWildcards={false} />
        <div className="deck-popup-credit">by MTG Arena Tool</div>
      </div>

      {failed ? (
        <div className="deck-popup-status">Could not save the image.</div>
      ) : null}
    </>
  );
}
