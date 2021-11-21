/* eslint-disable react/no-array-index-key */
import { Deck, CardObject, database } from "mtgatool-shared";
import { Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import reduxAction from "../../../redux/reduxAction";
import { getCardImage } from "../../../utils/getCardArtCrop";
import DeckTypesStats from "../../DeckTypesStats";
import Section from "../../ui/Section";
import Button from "../../ui/Button";
import { AppState } from "../../../redux/stores/rendererStore";

interface VisualDeckViewProps {
  deck: Deck;
  setRegularView: () => void;
}

type SplitIds = [number, number, number, number];

function cmcSort(a: CardObject, b: CardObject): number {
  const ca = database.card(a.id);
  const cb = database.card(b.id);

  if (ca && cb) {
    return cb.cmc - ca.cmc;
  }
  return 0;
}

export default function VisualDeckView(
  props: VisualDeckViewProps
): JSX.Element {
  const { deck, setRegularView } = props;

  const sz = useSelector(
    (state: AppState) => 100 + state.settings.cardsSize * 15
  );
  const cardQuality = useSelector(
    (state: AppState) => state.settings.cardsQuality
  );
  const dispatcher = useDispatch();

  const hoverCard = (id: number, hover: boolean): void => {
    reduxAction(dispatcher, {
      type: hover ? "SET_HOVER_IN" : "SET_HOVER_OUT",
      arg: { grpId: id },
    });
  };

  // attempt at sorting visually..
  const newMainDeck: number[] = [];
  deck
    .getMainboard()
    .get()
    .sort(cmcSort)
    .forEach((c: CardObject) => {
      for (let i = 0; i < c.quantity; i += 1) {
        newMainDeck.push(c.id);
      }
    });

  const splitDeck: SplitIds[] = [];
  for (let i = 0; i < newMainDeck.length; i += 4) {
    splitDeck.push([
      newMainDeck[i] || 0,
      newMainDeck[i + 1] || 0,
      newMainDeck[i + 2] || 0,
      newMainDeck[i + 3] || 0,
    ]);
  }

  const newSideboard: number[] = [];
  deck
    .getSideboard()
    .get()
    .forEach((c: CardObject) => {
      for (let i = 0; i < c.quantity; i += 1) {
        newSideboard.push(c.id);
      }
    });

  return (
    <div className="visual-view-grid">
      <Section
        style={{
          padding: "16px",
          gridArea: "controls",
        }}
      >
        <Button
          style={{ margin: "auto" }}
          text="Normal View"
          onClick={setRegularView}
        />
      </Section>
      <Section style={{ gridArea: "types" }}>
        <DeckTypesStats deck={deck} />
      </Section>
      <Section
        style={{
          padding: "16px",
          paddingBottom: `${52 + sz / 2}px`,
          gridArea: "main",
        }}
      >
        <div className="visual-mainboard">
          {splitDeck.map((idsList: SplitIds, index: number) => {
            const cards = idsList.map((grpId: number, cindex: number) => {
              const cardObj = database.card(grpId);
              if (cardObj) {
                return (
                  <div
                    style={{ width: `${sz}px`, height: `${sz * 0.166}px` }}
                    key={`visual-main-${cindex}`}
                    className="deck-visual-card"
                  >
                    <img
                      onMouseEnter={(): void => {
                        hoverCard(grpId, true);
                      }}
                      onMouseLeave={(): void => {
                        hoverCard(grpId, false);
                      }}
                      style={{ width: `${sz}px` }}
                      src={getCardImage(cardObj, cardQuality)}
                      className="deck-visual-card-img"
                    />
                  </div>
                );
              }
              return <Fragment key={`visual-main-${cindex}`} />;
            });
            return (
              <div
                key={`visual-${index}`}
                style={{ marginBottom: `${sz * 0.5}px` }}
                className="deck-visual-tile"
              >
                {cards}
              </div>
            );
          })}
        </div>
      </Section>
      <Section style={{ padding: "16px", gridArea: "side" }}>
        <div className="deck-visual-tile-side">
          {newSideboard.map((grpId: number, _n: number) => {
            const cardObj = database.card(grpId);
            if (cardObj) {
              return (
                <div
                  key={`visual-side-${_n}`}
                  style={{
                    width: `${sz}px`,
                    height: `${sz * 0.166}px`,
                    marginLeft: _n % 2 == 0 ? "60px" : "",
                  }}
                  className="deck-visual-card-side"
                >
                  <img
                    onMouseEnter={(): void => {
                      hoverCard(grpId, true);
                    }}
                    onMouseLeave={(): void => {
                      hoverCard(grpId, false);
                    }}
                    style={{ width: `${sz}px` }}
                    src={getCardImage(cardObj, cardQuality)}
                    className="deck-visual-card-img"
                  />
                </div>
              );
            }
            return <Fragment key={`visual-side-${_n}`} />;
          })}
        </div>
      </Section>
    </div>
  );
}
