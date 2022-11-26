/* eslint-disable react/no-array-index-key */
import { CardsList, database, Deck, formatPercent } from "mtgatool-shared";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { AppState } from "../../../redux/stores/rendererStore";
import { StatsDeck } from "../../../types/dbTypes";
import getDeckDiff, { DeckDiff } from "../../../utils/getDeckDiff";
import getWinrateClass from "../../../utils/getWinrateClass";
import CardTile from "../../CardTile";
import DeckList from "../../DeckList";
import Flex from "../../Flex";
import Button from "../../ui/Button";
import Section from "../../ui/Section";

interface ChangesDeckViewProps {
  setRegularView: () => void;
}

function sortByLastUsed(a: StatsDeck, b: StatsDeck) {
  if (a.lastUsed > b.lastUsed) return -1;
  if (a.lastUsed < b.lastUsed) return 1;
  return 0;
}

export default function ChangesDeckView(
  props: ChangesDeckViewProps
): JSX.Element {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { setRegularView } = props;
  const [allDecksData, setAllDecksData] = useState<StatsDeck[]>([]);
  const [currentHash, setCurrentHash] = useState(0);
  const params = useParams<{ page: string; id: string }>();
  const fullStats = useSelector((state: AppState) => state.mainData.fullStats);

  const decksChanges = allDecksData.map((deck, index) => {
    let change: DeckDiff = {
      added: new CardsList([]),
      removed: new CardsList([]),
    };

    if (index !== allDecksData.length - 1) {
      const next = allDecksData[index + 1];
      const oldDeck = new Deck({}, deck.mainDeck, deck.sideboard);
      const nextDeck = new Deck({}, next.mainDeck, next.sideboard);
      change = getDeckDiff(oldDeck, nextDeck);
    }

    return change;
  });

  useEffect(() => {
    if (fullStats) {
      const decks = fullStats.decks[params.id];
      const allDecksStats = decks
        .map((d) => fullStats.deckIndex[d])
        .sort(sortByLastUsed);

      setAllDecksData(allDecksStats);
    }
  }, [fullStats, params]);

  const currentDeck = allDecksData[currentHash];

  const currentDeckObj = new Deck(
    {},
    currentDeck?.mainDeck || [],
    currentDeck?.sideboard || []
  );

  return (
    <div className="changes-view-grid">
      <Section style={{ padding: "16px", gridArea: "controls" }}>
        <Button
          style={{ margin: "auto" }}
          text="Normal View"
          onClick={setRegularView}
        />
      </Section>
      <Section style={{ padding: "16px", gridArea: "deck" }}>
        {currentDeck ? (
          <>
            <Flex style={{ flexDirection: "column", width: "50%" }}>
              <DeckList deck={currentDeckObj} showWildcards />
            </Flex>
            <Flex
              style={{
                flexDirection: "column",
                width: "50%",
                paddingLeft: "16px",
              }}
            >
              <div className="card-tile-separator">
                Added ({decksChanges[currentHash].added.count()})
              </div>
              {decksChanges[currentHash].added.get().map((card) => {
                const cardObj = database.card(card.id);
                return cardObj ? (
                  <CardTile
                    indent="a"
                    isHighlighted={false}
                    isSideboard={false}
                    showWildcards={false}
                    card={cardObj}
                    key={`added-card-${card.id}`}
                    quantity={{
                      type: "NUMBER",
                      quantity: card.quantity,
                    }}
                  />
                ) : (
                  <></>
                );
              })}
              <div className="card-tile-separator">
                Removed ({decksChanges[currentHash].removed.count()})
              </div>
              {decksChanges[currentHash].removed.get().map((card) => {
                const cardObj = database.card(card.id);
                return cardObj ? (
                  <CardTile
                    indent="a"
                    isHighlighted={false}
                    isSideboard={false}
                    showWildcards={false}
                    card={cardObj}
                    key={`removed-card-${card.id}`}
                    quantity={{
                      type: "NUMBER",
                      quantity: card.quantity,
                    }}
                  />
                ) : (
                  <></>
                );
              })}
            </Flex>
          </>
        ) : (
          <></>
        )}
      </Section>
      <div
        style={{
          gridArea: "changes",
          flexDirection: "column",
        }}
      >
        {allDecksData.map((d, index) => {
          const totalMatches = d.stats.matchLosses + d.stats.matchWins;
          const winrate =
            totalMatches > 0 ? d.stats.matchWins / totalMatches : 0;

          // let winrateInterval = "???";
          // if (totalMatches >= 20) {
          //   winrateInterval = formatPercent(winrate);
          // }

          return (
            <Section
              style={{
                cursor: "pointer",
                flexDirection: "column",
                width: "240px",
                padding: "16px",
                marginBottom: "16px",
                backgroundColor: `var(--color-${
                  index === currentHash ? "dark" : "section"
                })`,
              }}
              key={`change${d?.id}-${d.deckHash}`}
              onClick={() => setCurrentHash(index)}
            >
              <Flex style={{ justifyContent: "space-between" }}>
                <div style={{ fontFamily: "var(--main-font-name-it)" }}>
                  Winrate
                </div>
                <div>
                  {d.stats.matchWins}:{d.stats.matchLosses} (
                  <span className={getWinrateClass(winrate, true)}>
                    {formatPercent(winrate)}
                  </span>{" "}
                  <i style={{ opacity: 0.6 }} />)
                </div>
              </Flex>
              <Flex style={{ justifyContent: "space-between" }}>
                <div style={{ fontFamily: "var(--main-font-name-it)" }}>
                  Changes
                </div>
                <Flex>
                  <p className="green">+{decksChanges[index].added.count()}</p>
                  <p className="red" style={{ marginLeft: "6px" }}>
                    -{decksChanges[index].removed.count()}
                  </p>
                </Flex>
              </Flex>
            </Section>
          );
        })}
      </div>
    </div>
  );
}
