/* eslint-disable react/no-array-index-key */
import _ from "lodash";
import {
  CardObject,
  cardType,
  database,
  DbCardDataV2,
  Deck,
} from "mtgatool-shared";

import CardTile from "./CardTile";
import Separator from "./Separator";

interface GroupedCard extends CardObject {
  data?: DbCardDataV2;
}

function cardsSort(a: GroupedCard, b: GroupedCard) {
  if (!a.data || !b.data) return 0;
  if (a.data.Cmc > b.data.Cmc) return 1;
  if (a.data.Cmc < b.data.Cmc) return -1;
  if (a.data.Name > b.data.Name) return 1;
  if (a.data.Name < b.data.Name) return -1;
  return 0;
}

function getDeckComponents(
  deck: Deck,
  showWildcards = false,
  showOdds = false
): JSX.Element[] {
  const components = [];
  const comp = deck.getCompanion();
  if (comp) {
    const companionGrpId = comp;
    components.push(<Separator key="sep_commander">Companion</Separator>);
    const cardObj = database.card(companionGrpId || 0);
    if (cardObj) {
      components.push(
        <CardTile
          indent="a"
          isHighlighted={false}
          isSideboard={false}
          showWildcards={showWildcards}
          deck={deck}
          card={cardObj}
          key={`companioncardtile-${companionGrpId}`}
          quantity={{
            type: "NUMBER",
            quantity: 1,
          }}
        />
      );
    }
  }

  if (deck.getCommanders() && deck.getCommanders().length > 0) {
    components.push(<Separator key="sep_commander">Commander</Separator>);

    deck.getCommanders().forEach((id: number, index: number) => {
      if (index % 2 == 0) {
        const card = database.card(id);
        if (card) {
          components.push(
            <CardTile
              indent="a"
              isHighlighted={false}
              isSideboard={false}
              showWildcards={showWildcards}
              deck={deck}
              card={card}
              key={`commandercardtile${index}_${id}`}
              quantity={{
                type: "NUMBER",
                quantity: 1,
              }}
            />
          );
        }
      }
    });
  }

  // draw maindeck grouped by cardType
  const cardsByGroup = _(deck.getMainboard().get())
    .map((card) => ({ data: database.card(card.id), ...card }))
    .filter((card) => card.data !== undefined)
    .groupBy((card) => {
      const type = cardType(card.data as DbCardDataV2);
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
        case "Battle":
          return "Battles";
        case "Artifact":
          return "Artifacts";
        case "Land":
        case "Basic Land":
        case "Basic Snow Land":
          return "Lands";
        default:
          throw new Error(`Unexpected card type: ${card.grpId} ${type}`);
      }
    })
    .value();

  _([
    "Creatures",
    "Planeswalkers",
    "Spells",
    "Enchantments",
    "Battles",
    "Artifacts",
    "Lands",
  ])
    .filter((group) => !_.isEmpty(cardsByGroup[group]))
    .forEach((group) => {
      // draw a separator for the group
      const cards = cardsByGroup[group];
      const count = _.sumBy(cards, "quantity");
      components.push(
        <Separator key={`sepm_${group}`}>{`${group} (${count})`}</Separator>
      );

      // draw the cards
      _(cards)
        .filter((card) => card.quantity > 0)
        .sort(cardsSort)
        .forEach((card, index) => {
          components.push(
            <CardTile
              indent="b"
              isHighlighted={false}
              isSideboard={false}
              showWildcards={showWildcards}
              deck={deck}
              card={card.data as DbCardDataV2}
              key={`mainboardcardtile${index}_${card.id}`}
              quantity={
                showOdds
                  ? {
                      type: "ODDS",
                      quantity: card.quantity,
                      odds: `${card.chance || 0}%`,
                    }
                  : {
                      type: "NUMBER",
                      quantity: card.quantity,
                    }
              }
            />
          );
        });
    });

  let sideboardSize = _.sumBy(deck.getSideboard().get(), "quantity");
  if (sideboardSize) {
    // draw a separator for the sideboard
    components.push(
      <Separator key="sep_side">{`Sideboard (${sideboardSize})`}</Separator>
    );

    if (comp) {
      sideboardSize -= 1;
      deck.getSideboard().remove(comp);
    }

    // draw the cards
    _(deck.getSideboard().get())
      .map((card) => ({ data: database.card(card.id), ...card }))
      .filter((card) => card.quantity > 0)
      .sort(cardsSort)
      .forEach((card, index) => {
        components.push(
          <CardTile
            indent="a"
            isHighlighted={false}
            isSideboard
            showWildcards={showWildcards}
            deck={deck}
            card={card.data as DbCardDataV2}
            key={`sideboardcardtile${index}_${card.id}`}
            quantity={{
              type: "NUMBER",
              quantity: card.quantity,
            }}
          />
        );
      });
  }

  return components;
}

interface DeckListProps {
  deck: Deck;
  showWildcards?: boolean;
  showOdds?: boolean;
}

export default function DeckList(props: DeckListProps): JSX.Element {
  const { deck, showWildcards, showOdds } = props;
  if (!deck || database.version == 0) return <></>;
  return <>{getDeckComponents(deck, showWildcards, showOdds)}</>;
}
