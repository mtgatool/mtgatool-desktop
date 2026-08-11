import { useEffect, useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";

import { ReactComponent as BackIcon } from "../../../assets/images/svg/back.svg";
import { getData } from "../../../data/store";
import { useCards } from "../../../hooks/useCard";
import { InternalDraftv2 } from "../../../types";
import getEventPrettyName from "../../../utils/getEventPrettyName";
import Deck from "../../../utils/mtga/deck";
import timeAgo from "../../../utils/timeAgo";
import CardTile from "../../CardTile";
import DeckList from "../../DeckList";
import SvgButton from "../../SvgButton";
import Button from "../../ui/Button";
import Section from "../../ui/Section";
import CardLiveDraft from "./CardLiveDraft";

interface DraftStep {
  pack: number;
  pick: number;
}

export default function DraftView() {
  const params = useParams<{ id: string }>();
  const history = useHistory();

  const [draft, setDraft] = useState<InternalDraftv2 | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [showDeck, setShowDeck] = useState(false);

  useEffect(() => {
    getData<InternalDraftv2>(decodeURIComponent(params.id)).then((record) => {
      if (record) setDraft(record);
    });
  }, [params.id]);

  // Every pack/pick that actually happened, in draft order. A recorded pick
  // with no stored pack still counts: records saved before the "Completed"
  // clobber fix lost the final one-card pack, but the pick itself names it.
  const steps = useMemo((): DraftStep[] => {
    if (!draft) return [];
    const list: DraftStep[] = [];
    draft.packs.forEach((packRounds, pack) => {
      packRounds.forEach((cards, pick) => {
        const hasPack = cards && cards.length > 0;
        const hasPick = draft.picks[pack] && draft.picks[pack][pick] > 0;
        if (hasPack || hasPick) {
          list.push({ pack, pick });
        }
      });
    });
    return list;
  }, [draft]);

  const step = steps[Math.min(stepIndex, Math.max(steps.length - 1, 0))];
  const packCards = useMemo(() => {
    if (!draft || !step) return [];
    const stored = draft.packs[step.pack][step.pick];
    if (stored && stored.length > 0) return stored;
    // Lost pack, known pick — show the card that was taken from it.
    const picked = draft.picks[step.pack][step.pick];
    return picked > 0 ? [picked] : [];
  }, [draft, step]);
  const chosen = draft && step ? draft.picks[step.pack][step.pick] : 0;
  // One card leaves the pool per step, so the pool before this step is the
  // first stepIndex entries of the cumulative picked list.
  const poolSoFar = useMemo(
    () => (draft ? draft.pickedCards.slice(0, stepIndex) : []),
    [draft, stepIndex]
  );

  // Prefetch this pack's images and resolve the pool's tiles.
  useCards(packCards);
  const poolCards = useCards(poolSoFar);

  const deck = useMemo(() => {
    if (!draft || !draft.deckMain) return null;
    return new Deck({
      id: draft.deckId ?? "",
      name: getEventPrettyName(draft.eventId),
      mainDeck: draft.deckMain,
      sideboard: draft.deckSide ?? [],
    });
  }, [draft]);

  if (!draft) {
    return <></>;
  }

  const lastStep = Math.max(steps.length - 1, 1);
  const progress = (Math.min(stepIndex, lastStep) / lastStep) * 100;

  // Step indices where a new pack begins (pack 2 and 3), for the scrubber's
  // dividers; segments feed the "Pack N" labels underneath.
  const packStarts: number[] = [];
  steps.forEach((s, i) => {
    if (i > 0 && s.pack !== steps[i - 1].pack) packStarts.push(i);
  });
  const segmentBounds = [0, ...packStarts, steps.length];

  return (
    <div className="draft-view-grid">
      <Section className="draft-view-header">
        <SvgButton
          svg={BackIcon}
          style={{ height: "32px", width: "32px" }}
          onClick={() => history.push("/drafts")}
        />
        <h2>
          {getEventPrettyName(draft.eventId)}
          {draft.draftSet ? ` — ${draft.draftSet}` : ""}
        </h2>
        <div className="draft-replay-date">
          {draft.date ? timeAgo(new Date(draft.date).getTime()) : ""}
        </div>
        {deck && (
          <div className="draft-replay-deck-toggle">
            <Button
              text={showDeck ? "Back to replay" : "Show final deck"}
              onClick={() => setShowDeck(!showDeck)}
            />
          </div>
        )}
      </Section>

      <Section className="draft-view-pack">
        {showDeck && deck ? (
          <div className="draft-replay-deck">
            <DeckList deck={deck} showWildcards={false} />
          </div>
        ) : (
          <>
            {step && (
              <div className="draft-replay-nav">
                <Button
                  text="◀"
                  disabled={stepIndex === 0}
                  onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
                />
                <h3>{`Pack ${step.pack + 1} · Pick ${step.pick + 1}`}</h3>
                <Button
                  text="▶"
                  disabled={stepIndex >= steps.length - 1}
                  onClick={() =>
                    setStepIndex(Math.min(steps.length - 1, stepIndex + 1))
                  }
                />
              </div>
            )}
            <div className="draft-replay-scrubber">
              <div className="track">
                <div className="bar" style={{ width: `${progress}%` }} />
                {packStarts.map((i) => (
                  <div
                    key={`pack-tick-${i}`}
                    className="tick"
                    style={{ left: `${(i / lastStep) * 100}%` }}
                  />
                ))}
                <div className="thumb" style={{ left: `${progress}%` }} />
              </div>
              <input
                type="range"
                min={0}
                max={lastStep}
                value={Math.min(stepIndex, lastStep)}
                onChange={(e) => setStepIndex(parseInt(e.target.value, 10))}
              />
              <div className="labels">
                {segmentBounds.slice(0, -1).map((start, seg) => {
                  const end = segmentBounds[seg + 1];
                  const center = ((start + end - 1) / 2 / lastStep) * 100;
                  return (
                    <div
                      key={`pack-label-${start}`}
                      className="label"
                      style={{ left: `${center}%` }}
                    >
                      {`Pack ${steps[start].pack + 1}`}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pack-container">
              {packCards.map((grpId, i) => (
                <CardLiveDraft
                  // A pack can hold duplicate grpIds, so position is the key.
                  // eslint-disable-next-line react/no-array-index-key
                  key={`${grpId}-${i}-draft-replay`}
                  grpId={grpId}
                  selected={grpId === chosen}
                  size={150}
                />
              ))}
            </div>
          </>
        )}
      </Section>

      <Section className="draft-view-picked">
        <h3>{`Picked (${poolSoFar.length})`}</h3>
        <div className="picks-list">
          {poolCards.map((card, i) =>
            card ? (
              <CardTile
                // eslint-disable-next-line react/no-array-index-key
                key={`draft-pool-${card.GrpId}-${i}`}
                card={card}
                indent="a"
                isHighlighted={false}
                isSideboard={false}
                quantity={{ type: "NUMBER", quantity: 1 }}
                showWildcards={false}
              />
            ) : null
          )}
        </div>
      </Section>
    </div>
  );
}
