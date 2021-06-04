/* eslint-disable react/no-array-index-key */
import { CardsList, CardObject, database } from "mtgatool-shared";
import { Fragment } from "react";
import CardTile from "./CardTile";

interface CardListProps {
  list: CardsList;
}

export default function CardList(props: CardListProps): JSX.Element {
  const { list } = props;
  if (!list || database.version == 0) return <></>;
  return (
    <>
      {list.get().map((card: CardObject, index: number) => {
        const cardObj = database.card(card.id);
        if (cardObj) {
          return (
            <CardTile
              indent="a"
              isHighlighted={false}
              isSideboard={false}
              showWildcards={false}
              card={cardObj}
              key={`cardlist${index}-${card.id}`}
              quantity={{ type: "NUMBER", quantity: card.quantity }}
            />
          );
        }
        return <Fragment key={`cardlist${index}-${card.id}`} />;
      })}
    </>
  );
}
