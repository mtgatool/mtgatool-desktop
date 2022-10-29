import {
  constants,
  Deck,
  CardObject,
  database,
  Chances,
} from "mtgatool-shared";

const { CARD_TYPES, CARD_TYPE_CODES } = constants;

const typeIcons: Record<string, string> = {};
typeIcons.art = "type-art";
typeIcons.cre = "type-cre";
typeIcons.enc = "type-enc";
typeIcons.ins = "type-ins";
typeIcons.lan = "type-lan";
typeIcons.pla = "type-pla";
typeIcons.sor = "type-sor";

function getDeckTypesAmount(deck: Deck): { [key: string]: number } {
  const types = { art: 0, cre: 0, enc: 0, ins: 0, lan: 0, pla: 0, sor: 0 };
  if (!deck.getMainboard().get()) return types;

  deck
    .getMainboard()
    .get()
    .forEach((card: CardObject | any) => {
      // TODO remove group lands hack
      if (card?.id?.id === 100) {
        return;
      }
      const c = database.card(card.id);
      if (c) {
        if (c.Types.includes("Land", 0)) types.lan += card.quantity;
        if (c.Types.includes("Creature", 0)) types.cre += card.quantity;
        if (c.Types.includes("Artifact", 0)) types.art += card.quantity;
        if (c.Types.includes("Enchantment", 0)) types.enc += card.quantity;
        if (c.Types.includes("Instant", 0)) types.ins += card.quantity;
        if (c.Types.includes("Sorcery", 0)) types.sor += card.quantity;
        if (c.Types.includes("Planeswalker", 0)) types.pla += card.quantity;
      }
    });

  return types;
}

export default function LiveDeckTypesStats(props: {
  className?: string;
  cardOdds: Chances;
  deck: Deck;
}): JSX.Element {
  const { className, cardOdds, deck } = props;
  const cardTypes = getDeckTypesAmount(deck);
  return (
    <div className={className || "types-container"}>
      {CARD_TYPE_CODES.map((cardTypeKey, index) => {
        return (
          // eslint-disable-next-line react/no-array-index-key
          <div className="type-icon-cont" key={`type-icon-cont-${index}`}>
            <div
              className={`${"type-icon"} ${typeIcons[cardTypeKey]}`}
              title={CARD_TYPES[index]}
            />
            <span>{cardTypes[cardTypeKey]} left</span>
            <span>
              {cardTypeKey === "art" ? cardOdds.chanceArt : ""}
              {cardTypeKey === "cre" ? cardOdds.chanceCre : ""}
              {cardTypeKey === "enc" ? cardOdds.chanceEnc : ""}
              {cardTypeKey === "ins" ? cardOdds.chanceIns : ""}
              {cardTypeKey === "lan" ? cardOdds.chanceLan : ""}
              {cardTypeKey === "pla" ? cardOdds.chancePla : ""}
              {cardTypeKey === "sor" ? cardOdds.chanceSor : ""}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
