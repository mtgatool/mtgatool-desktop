/* eslint-disable no-bitwise */
import { Fragment, useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { AppState } from "../../../redux/stores/rendererStore";
import { GunDeck } from "../../../types/gunTypes";
import getLocalSetting from "../../../utils/getLocalSetting";
import DecksArtViewRow from "../../DecksArtViewRow";
import ManaFilter from "../../ManaFilter";

export default function DecksList() {
  const history = useHistory();
  const [colorFilter, setColorFilter] = useState(63); // Binary for "all colors"

  const { decksIndex, decks } = useSelector(
    (state: AppState) => state.mainData
  );

  const openDeck = useCallback(
    (deck: GunDeck) => {
      // reduxAction(dispatch, { type: "SET_BACK_GRPID", arg: deck.tile });
      history.push(`/decks/${deck.deckId}`);
    },
    [history]
  );

  const decksFilter = useCallback(
    (deck: GunDeck): boolean => {
      if (deck.playerId !== getLocalSetting("playerId")) return false;
      // Filter colors
      if ((deck.colors & ~colorFilter) == 0) return true;
      return false;
    },
    [colorFilter]
  );

  return (
    <>
      <div className="section" style={{ marginBottom: "0px" }}>
        <ManaFilter initialState={colorFilter} callback={setColorFilter} />
      </div>
      <div className="section" style={{ margin: "16px 0" }}>
        <div className="decks-table-wrapper">
          {Object.keys(decksIndex)
            .map((key) => decks[`${key}-v${decksIndex[key]}`])
            .filter((d) => d)
            .filter(decksFilter)
            .sort((a, b) => {
              if (a.lastModified > b.lastModified) return -1;
              if (a.lastModified < b.lastModified) return 1;
              return 0;
            })
            .sort((a, b) => {
              if (a.lastUsed > b.lastUsed) return -1;
              if (a.lastUsed < b.lastUsed) return 1;
              return 0;
            })
            .map((deck) => {
              if (deck && deck.internalDeck) {
                return (
                  <DecksArtViewRow
                    clickDeck={openDeck}
                    key={deck.deckId}
                    deck={deck}
                  />
                );
              }
              return <Fragment key={deck.deckId} />;
            })}
        </div>
      </div>
    </>
  );
}
