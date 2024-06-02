import { Deck } from "mtgatool-shared";
import { DEFAULT_TILE } from "mtgatool-shared/dist/shared/constants";

import { ReactComponent as Close } from "../../assets/images/svg/close.svg";
import { getCardArtCrop } from "../../utils/getCardArtCrop";
import DeckColorsBar from "../DeckColorsBar";
import DeckList from "../DeckList";
import ManaCost from "../ManaCost";

interface DeckViewPopupProps {
  onClose: () => void;
  deck: Deck;
}

export default function DeckViewPopup(props: DeckViewPopupProps) {
  const { onClose, deck } = props;

  return (
    <>
      <div className="close-button" onClick={onClose}>
        <Close fill="var(--color-text-hover)" />
      </div>
      <div style={{ margin: "16px auto", maxWidth: "480px", width: "480px" }}>
        <div
          className="decks-top small"
          style={{
            backgroundImage: deck
              ? `url(${getCardArtCrop(deck.tile || DEFAULT_TILE)})`
              : "",
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
      </div>
    </>
  );
}
