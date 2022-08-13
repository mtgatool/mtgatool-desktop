/* eslint-disable no-loop-func */
/* eslint-disable react/no-array-index-key */
import _ from "lodash";
import {
  Deck,
  CardObject,
  database,
  DbCardData,
  cardType,
} from "mtgatool-shared";
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
    return ca.cmc - cb.cmc;
  }
  return 0;
}

function groupsReorderLoop(groups: SplitIds[], forceFix = false) {
  const finalGroups = [...groups];
  let loop = true;
  let phase = 2;
  let loops = 0;
  while (loop) {
    let matchedIndex = -1;
    let found = 0;
    console.log([...finalGroups]);
    finalGroups.forEach((g, i) => {
      const fnz = g.filter((id) => id !== 0);
      if (matchedIndex === -1) {
        if (fnz.length === phase) {
          matchedIndex = i;
        }
      } else if (matchedIndex > -1) {
        if (phase === 2 && fnz.length === 2) {
          finalGroups[matchedIndex] = [
            ...finalGroups[matchedIndex],
            ...finalGroups[i],
          ].filter((id) => id !== 0) as unknown as SplitIds;
          console.log(phase, fnz.length, finalGroups);
          finalGroups[i] = [0, 0, 0, 0];
          matchedIndex = -2;
          found += 1;
        } else if (phase === 2 && fnz.length === 1) {
          finalGroups[matchedIndex] = [
            ...finalGroups[matchedIndex],
            ...finalGroups[i],
          ].filter((id) => id !== 0) as unknown as SplitIds;
          console.log(phase, fnz.length, finalGroups);
          finalGroups[i] = [0, 0, 0, 0];
          matchedIndex = -2;
          found += 1;
        } else if (phase === 3 && fnz.length === 1) {
          finalGroups[matchedIndex] = [
            ...finalGroups[matchedIndex],
            ...finalGroups[i],
          ].filter((id) => id !== 0) as unknown as SplitIds;
          console.log(phase, fnz.length, finalGroups);
          finalGroups[i] = [0, 0, 0, 0];
          matchedIndex = -2;
          phase = 2;
          found += 1;
        } else if (phase === 3 && fnz.length === 2 && forceFix) {
          finalGroups[matchedIndex] = [
            ...finalGroups[matchedIndex],
            fnz[0],
          ].filter((id) => id !== 0) as unknown as SplitIds;
          console.log(phase, fnz.length, finalGroups);
          finalGroups[i] = [fnz[1], 0, 0, 0];
          phase = 2;
          matchedIndex = -2;
          found += 1;
        } else if (phase === 3 && fnz.length === 3 && forceFix) {
          finalGroups[matchedIndex] = [
            ...finalGroups[matchedIndex],
            fnz[0],
          ].filter((id) => id !== 0) as unknown as SplitIds;
          console.log(phase, fnz.length, finalGroups);
          finalGroups[i] = [fnz[1], fnz[2], 0, 0];
          matchedIndex = -2;
          phase = 2;
          found += 1;
        } else if (phase === 1 && fnz.length === 1) {
          finalGroups[matchedIndex] = [
            ...finalGroups[matchedIndex],
            ...finalGroups[i],
          ].filter((id) => id !== 0) as unknown as SplitIds;
          console.log(phase, fnz.length, finalGroups);
          finalGroups[i] = [0, 0, 0, 0];
          matchedIndex = -2;
          phase = 2;
          found += 1;
        }
      }
    });

    loops += 1;
    if (loops > 100) loop = false;
    if (!found) {
      if (phase === 2) phase = 3;
      else if (phase === 3) phase = 1;
      else if (phase === 1) loop = false;
    }
  }
  return finalGroups;
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

  const cardsByGroup = _(deck.getMainboard().get())
    .map((card) => ({ data: database.card(card.id), ...card }))
    .filter((card) => card.data !== undefined)
    .groupBy((card) => {
      const type = cardType(card.data as DbCardData);
      switch (type) {
        case "Creature":
          return "Creatures";
        case "Planeswalker":
          return "Planeswalkers";
        case "Instant":
        case "Sorcery":
          return "Spells";
        case "Enchantment":
          return "Enchantments";
        case "Artifact":
          return "Artifacts";
        case "Land":
        case "Basic Land":
        case "Basic Snow Land":
          return "Lands";
        default:
          throw new Error(`Unexpected card type: ${type}`);
      }
    })
    .value();

  const groupsOrder = [
    "Creatures",
    "Artifacts",
    "Enchantments",
    "Spells",
    "Planeswalkers",
    "Lands",
  ];

  let finalSplits: SplitIds[] = [];

  groupsOrder.forEach((group) => {
    const splitGroup: SplitIds[] = [];

    if (cardsByGroup[group]) {
      cardsByGroup[group].sort(cmcSort).forEach((c) => {
        for (let i = c.quantity; i > 0; i -= 4) {
          if (c.id) {
            splitGroup.push(new Array(Math.min(4, i)).fill(c.id) as any);
          }
        }
      });

      const rearrangedSplit = groupsReorderLoop(splitGroup);

      rearrangedSplit.forEach((g) => {
        const fnz = g.filter((id) => id !== 0);
        if (fnz.length !== 0) {
          finalSplits.push(g);
        }
      });
    }
  });

  finalSplits = groupsReorderLoop(finalSplits, true);

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
        <div
          className="visual-mainboard"
          style={{ maxWidth: `${(sz + 16) * 5}px` }}
        >
          {finalSplits.map((idsList: SplitIds, index: number) => {
            const cards = idsList.map((grpId: number, cindex: number) => {
              const cardObj = database.card(grpId);
              if (cardObj) {
                return (
                  <div
                    style={{ width: `${sz}px`, height: `${sz * 0.18}px` }}
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
                style={{ marginBottom: `${Math.round(sz + sz * 0.2)}px` }}
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
                    height: `${sz * 0.18}px`,
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
