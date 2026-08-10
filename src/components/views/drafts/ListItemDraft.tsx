import { useMemo } from "react";

import { DEFAULT_TILE } from "../../../constants";
import { useCards } from "../../../hooks/useCard";
import { InternalDraftv2 } from "../../../types";
import getEventPrettyName from "../../../utils/getEventPrettyName";
import Colors from "../../../utils/mtga/colors";
import timeAgo from "../../../utils/timeAgo";
import {
  Column,
  DeleteButton,
  FlexBottom,
  FlexTop,
  HoverTile,
  ListItem,
} from "../../ListItem";
import ManaCost from "../../ManaCost";

interface ListItemDraftProps {
  draft: InternalDraftv2;
  onClick: () => void;
  deleteCallback?: (draft: InternalDraftv2) => void;
}

export default function ListItemDraft(props: ListItemDraftProps): JSX.Element {
  const { draft, onClick, deleteCallback } = props;

  const timestamp = draft.date ? new Date(draft.date).getTime() : 0;

  // Colors of the submitted deck only — the pool is close to five-colour by
  // nature, which says nothing about what was actually built.
  const deckIds = useMemo(
    () =>
      (draft.deckMain ?? [])
        .map((c) => c.id)
        .filter((id, i, all) => all.indexOf(id) === i),
    [draft]
  );
  const cards = useCards(deckIds);
  const colorList = useMemo(() => {
    const colors = new Colors();
    cards.forEach((card) => {
      if (card?.ManaCost) colors.addFromCost(card.ManaCost);
    });
    return colors.get();
  }, [cards]);

  return (
    <ListItem click={onClick}>
      <div
        className="list-item-left-indicator"
        style={{ backgroundColor: "var(--color-section-active)" }}
      />
      <HoverTile grpId={draft.pickedCards[0] || DEFAULT_TILE} />
      <Column className="list-item-left">
        <FlexTop>
          <div className="list-deck-name">
            {getEventPrettyName(draft.eventId)}
          </div>
          <div className="list-deck-name-it">{draft.draftSet}</div>
        </FlexTop>
        <FlexBottom>
          {colorList.length > 0 && (
            <ManaCost className="mana-s20" colors={colorList} />
          )}
          <div
            style={{ lineHeight: "30px", marginLeft: "4px" }}
            className="list-match-time"
          >
            {timestamp ? <div className="time">{timeAgo(timestamp)}</div> : ""}
          </div>
        </FlexBottom>
      </Column>
      <Column className="list-item-center">
        <></>
      </Column>
      <Column className="list-item-right">
        <FlexTop>
          <div className="list-match-title" style={{ opacity: 0.7 }}>
            {draft.deckMain ? "Deck submitted" : "No deck"}
          </div>
        </FlexTop>
        <FlexBottom>
          <></>
        </FlexBottom>
      </Column>
      {deleteCallback && draft.id && (
        <DeleteButton
          dataId={draft.id}
          title="Delete draft"
          deleteCallback={() => deleteCallback(draft)}
        />
      )}
    </ListItem>
  );
}
