/* eslint-disable react/no-array-index-key */
import _ from "lodash";
import { cardType, Deck, DbCardData, database } from "mtgatool-shared";
import CardTile from "./CardTile";
import Separator from "./Separator";

function getDeckComponents(deck: Deck, showWildcards = false): JSX.Element[] {
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

  _([
    "Creatures",
    "Planeswalkers",
    "Spells",
    "Enchantments",
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
        .orderBy(["data.cmc", "data.name"])
        .forEach((card, index) => {
          components.push(
            <CardTile
              indent="b"
              isHighlighted={false}
              isSideboard={false}
              showWildcards={showWildcards}
              deck={deck}
              card={card.data as DbCardData}
              key={`mainboardcardtile${index}_${card.id}`}
              quantity={{
                type: "NUMBER",
                quantity: card.quantity,
              }}
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
      .orderBy(["data.cmc", "data.name"])
      .forEach((card, index) => {
        components.push(
          <CardTile
            indent="a"
            isHighlighted={false}
            isSideboard
            showWildcards={showWildcards}
            deck={deck}
            card={card.data as DbCardData}
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
}

export default function DeckList(props: DeckListProps): JSX.Element {
  const { deck, showWildcards } = props;
  if (!deck || database.version == 0) return <></>;
  return <>{getDeckComponents(deck, showWildcards)}</>;
}
