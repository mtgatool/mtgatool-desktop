/* eslint-disable no-nested-ternary */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable react/no-array-index-key */
import { Fragment, useState, useCallback, useEffect } from "react";

import { useDispatch } from "react-redux";
import { useHistory, useParams } from "react-router-dom";
import {
  CardsList,
  Deck,
  getEventPrettyName,
  MatchGameStats,
  compareCards,
} from "mtgatool-shared";

import { ReactComponent as BackIcon } from "../../../assets/images/svg/back.svg";
import { ReactComponent as CopyButton } from "../../../assets/images/svg/copy.svg";
import { ReactComponent as IconCrown } from "../../../assets/images/svg/crown.svg";
import { ReactComponent as IconTime } from "../../../assets/images/svg/time.svg";
import { ReactComponent as IconEvent } from "../../../assets/images/svg/event.svg";
import reduxAction from "../../../redux/reduxAction";
import copyToClipboard from "../../../utils/copyToClipboard";
import DeckColorsBar from "../../DeckColorsBar";
import SvgButton from "../../SvgButton";
import ManaCost from "../../ManaCost";
import Section from "../../ui/Section";
import Flex from "../../Flex";
import ResultDetails from "../../ResultDetails";
import Button from "../../ui/Button";
import RankIcon from "../../RankIcon";
import DeckList from "../../DeckList";
import { getCardArtCrop } from "../../../utils/getCardArtCrop";
import CardList from "../../CardList";
import { toMMSS } from "../../../utils/dateTo";
import ActionLog from "../../ActionLog";
import { DbMatch } from "../../../types/dbTypes";
import isLimitedEventId from "../../../utils/isLimitedEventId";
import getPlayerNameWithoutSuffix from "../../../utils/getPlayerNameWithoutSuffix";

interface GameStatsProps {
  game: MatchGameStats;
  index: number;
}

function GameStats(props: GameStatsProps): JSX.Element {
  const { game, index } = props;

  const addedCards = new CardsList(
    game.sideboardChanges ? game.sideboardChanges.added : []
  );
  const removedCards = new CardsList(
    game.sideboardChanges ? game.sideboardChanges.removed : []
  );

  return (
    <div
      style={{
        width: "100%",
      }}
    >
      {game.sideboardChanges ? (
        <>
          <div className="card-tile-separator">
            Game {index + 1} Sideboard Changes
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {game.sideboardChanges.added.length == 0 &&
            game.sideboardChanges.removed.length == 0 ? (
              <div className="gamestats-subtitle red">No Changes</div>
            ) : (
              <>
                <div className="gamestats-side">
                  <div className="gamestats-subtitle green">Sideboarded In</div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <CardList list={addedCards} />
                  </div>
                </div>
                <div className="gamestats-side">
                  <div className="gamestats-subtitle red">Sideboarded Out</div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <CardList list={removedCards} />
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <></>
      )}
      <div className="card-tile-separator">Game {index + 1} Hands Drawn</div>
      {game.handsDrawn.map((hand: any, i: number) => {
        return (
          <Fragment key={`gsh-${index}-${i}`}>
            <div className="gamestats-subtitle">#{i + 1}</div>
            <div className="card-lists-list">
              <CardList list={new CardsList(hand)} />
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

const VIEW_MATCH = 1;
const VIEW_LOG = 2;

export default function MatchView(): JSX.Element {
  const history = useHistory();
  const dispatch = useDispatch();
  const params = useParams<{ page: string; id: string }>();
  const [matchData, setMatchData] = useState<DbMatch>();
  console.log(params.id);

  useEffect(() => {
    window.toolDb
      .getData<DbMatch>(decodeURIComponent(params.id))
      .then((match: DbMatch | null) => {
        if (match) {
          setMatchData(match);
        }
      });
  }, [params]);

  const [view, setView] = useState(VIEW_MATCH);
  const [gameSeen, setGameSeen] = useState(0);

  const playerDeck = matchData
    ? new Deck(matchData.internalMatch.playerDeck)
    : undefined;
  const oppDeck = matchData
    ? new Deck(matchData.internalMatch.oppDeck)
    : undefined;
  const isLimited = matchData
    ? isLimitedEventId(matchData.internalMatch.eventId)
    : undefined;

  const logExists = matchData ? !!matchData.internalMatch.actionLog : undefined;
  const actionLogDataString = matchData
    ? matchData.internalMatch.actionLog ?? ""
    : undefined;

  const goBack = (): void => {
    history.goBack();
    reduxAction(dispatch, {
      type: "SET_BACK_GRPID",
      arg: null,
    });
  };

  const openActionLog = (): void => {
    setView(VIEW_LOG);
  };

  const openMatch = (): void => {
    setView(VIEW_MATCH);
  };

  useEffect(() => {
    setView(VIEW_MATCH);
  }, [matchData]);

  let deck = oppDeck;

  const arrayGameStats = matchData
    ? Object.values(matchData.internalMatch.gameStats)
    : undefined;

  // v4.1.0: Introduced by-game cards seen
  const gameDetails =
    matchData && matchData.internalMatch.toolVersion >= 262400;
  if (gameDetails) {
    const combinedList: number[] = [];
    if (arrayGameStats) {
      arrayGameStats
        .map((stats: MatchGameStats) => {
          const counts: { [key: number]: number } = {};
          if (stats) {
            // stats.cardsSeen.forEach(id => {
            //   counts[id] = counts[id] ? counts[id] + 1 : 1;
            // })
            for (const i in stats.cardsSeen) {
              const key = stats.cardsSeen[i];
              counts[key] = counts[key] ? counts[key] + 1 : 1;
            }
          }
          return counts;
        })
        .forEach((counts: { [key: string]: number }) => {
          for (const i in counts) {
            const key = Number(i);
            const c = combinedList.filter((d) => d === key).length;

            let loopCount = counts[i] - c;
            while (loopCount > 0) {
              combinedList.push(key);
              loopCount -= 1;
            }
          }
        });

      deck = new Deck(
        {},
        gameSeen == arrayGameStats?.length
          ? combinedList
          : arrayGameStats[gameSeen]?.cardsSeen || []
      );
    }
  }

  const existsPrev = useCallback((): boolean => {
    return gameSeen > 0;
  }, [gameSeen]);

  const existsNext = useCallback((): boolean => {
    return (
      matchData !== undefined &&
      matchData.internalMatch &&
      arrayGameStats !== undefined &&
      gameSeen < arrayGameStats.length
    );
  }, [gameSeen, matchData]);

  const gamePrev = useCallback(() => {
    if (existsPrev()) {
      setGameSeen(gameSeen - 1);
    }
  }, [existsPrev, gameSeen]);

  const gameNext = useCallback(() => {
    if (matchData && existsNext()) {
      setGameSeen(gameSeen + 1);
    }
  }, [existsNext, gameSeen, matchData]);

  const clickAdd = (): void => {
    // Add to your decks
  };

  const clickArena = (): void => {
    if (deck) {
      deck.sortMainboard(compareCards);
      deck.sortSideboard(compareCards);
      copyToClipboard(deck.getExportArena());
      reduxAction(dispatch, {
        type: "SET_POPUP",
        arg: {
          text: "Deck copied to clipboard.",
          duration: 5000,
          time: new Date().getTime(),
        },
      });
    }
  };

  const clickTxt = (): void => {
    // const str = deck.getExportTxt();
    // ipcSend("export_txt", { str, name: deck.getName() });
    // popup => Deck exported to text file.
  };

  const copyOppName = useCallback((): void => {
    if (matchData) {
      copyToClipboard(matchData.internalMatch.opponent.name);
      reduxAction(dispatch, {
        type: "SET_POPUP",
        arg: {
          text: "Opponent's name copied to clipboard.",
          duration: 5000,
          time: new Date().getTime(),
        },
      });
    }
  }, [matchData]);

  const duration = arrayGameStats
    ? arrayGameStats.reduce((acc, cur) => acc + cur.time, 0)
    : 0;

  const pw = matchData?.internalMatch.player.wins || 0;
  const ow = matchData?.internalMatch.opponent.wins || 0;

  if (!playerDeck || !matchData || !deck || !arrayGameStats) return <></>;
  return (
    <>
      <div
        className="matches-top"
        style={{
          backgroundImage: `url(${getCardArtCrop(playerDeck.tile)})`,
        }}
      >
        <DeckColorsBar deck={playerDeck} />
        <div className="top-inner">
          <div className="flex-item">
            <SvgButton
              style={{
                marginRight: "8px",
                backgroundColor: "var(--color-section)",
              }}
              svg={BackIcon}
              onClick={goBack}
            />
            <div
              style={{
                lineHeight: "32px",
                color: "var(--color-text-hover)",
                textShadow: "3px 3px 6px #000000",
              }}
            >
              {playerDeck.getName()}
            </div>
          </div>
          <div className="flex-item">
            <ManaCost
              className="manaS20"
              colors={playerDeck.getColors().get()}
            />
          </div>
        </div>
      </div>
      <div className="match-view-grid">
        <Section
          style={{
            lineHeight: "36px",
            padding: "16px",
            gridArea: "controls",
            justifyContent: "space-between",
          }}
        >
          <Flex>
            <IconCrown
              style={{ margin: "auto 16px auto 8px" }}
              fill="var(--color-icon)"
            />
            <div
              className="match-top-result"
              style={{ color: `var(--color-${pw > ow ? "g" : "r"})` }}
            >{`${pw}-${ow}`}</div>
            <ResultDetails match={matchData.internalMatch} />
          </Flex>
          <Flex>
            <IconEvent
              style={{ margin: "auto 16px auto 8px" }}
              fill="var(--color-icon)"
            />
            <div>{getEventPrettyName(matchData.internalMatch.eventId)}</div>
          </Flex>
          <Flex>
            <IconTime
              style={{ margin: "auto 16px auto 8px" }}
              fill="var(--color-icon)"
            />
            <div>{toMMSS(duration)}</div>
          </Flex>
          {view == VIEW_MATCH ? (
            <Button
              onClick={openActionLog}
              className="button-simple open-log"
              disabled={!logExists}
              text="Action log"
            />
          ) : (
            <Button
              onClick={openMatch}
              className="button-simple"
              text="Match"
            />
          )}
        </Section>

        <Section
          style={{
            padding: "16px",
            justifyContent: "space-between",
            gridArea: "name",
          }}
        >
          <Flex>
            <div className="match-player-name">
              vs{" "}
              {getPlayerNameWithoutSuffix(
                matchData.internalMatch.opponent.name
              )}
            </div>
            <SvgButton
              style={{ margin: "auto 2px" }}
              svg={CopyButton}
              onClick={copyOppName}
            />
          </Flex>
          <RankIcon
            rank={matchData.internalMatch.opponent.rank}
            tier={matchData.internalMatch.opponent.tier}
            percentile={matchData.internalMatch.opponent.percentile || 0}
            leaderboardPlace={
              matchData.internalMatch.opponent.leaderboardPlace || 0
            }
            format={isLimited ? "limited" : "constructed"}
          />
          <Flex>
            <ManaCost colors={oppDeck?.colors.get() || []} />
          </Flex>
        </Section>

        <Section
          style={{
            padding: "16px 10px",
            flexDirection: "column",
            gridArea: "buttons",
          }}
        >
          {gameDetails && matchData && (
            <div
              style={{
                display: "flex",
                lineHeight: "32px",
                marginBottom: "16px",
                justifyContent: "space-around",
              }}
            >
              <SvgButton
                style={!existsPrev() ? { cursor: "default", opacity: 0.5 } : {}}
                svg={BackIcon}
                onClick={gamePrev}
              />
              <div
                style={{
                  maxWidth: "130px",
                  textAlign: "center",
                  width: "-webkit-fill-available",
                }}
              >
                {gameSeen == arrayGameStats?.length
                  ? `Combined`
                  : `Seen in game ${gameSeen + 1}`}
              </div>
              <SvgButton
                style={
                  !existsNext()
                    ? {
                        cursor: "default",
                        opacity: 0.5,
                        transform: "rotate(180deg)",
                      }
                    : { transform: "rotate(180deg)" }
                }
                svg={BackIcon}
                onClick={gameNext}
              />
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button
              style={{ width: "auto", padding: "0 10px" }}
              onClick={clickAdd}
              text="Add to Decks"
            />
            <Button
              style={{ width: "auto", padding: "0 10px" }}
              onClick={clickArena}
              text="Export to Arena"
            />
            <Button
              style={{ width: "auto", padding: "0 10px" }}
              onClick={clickTxt}
              text="Export to .txt"
            />
          </div>
        </Section>

        <Section
          style={{
            padding: "16px",
            flexDirection: "column",
            gridArea: "deck",
          }}
        >
          <DeckList deck={deck} showWildcards />
        </Section>

        <Section
          style={{
            padding: "16px",
            gridArea: "right",
            flexDirection: "column",
          }}
        >
          {view == VIEW_LOG ? (
            <ActionLog logStr={actionLogDataString || ""} />
          ) : arrayGameStats[gameSeen] ? (
            <GameStats index={gameSeen} game={arrayGameStats[gameSeen]} />
          ) : (
            <></>
          )}
        </Section>
      </div>
    </>
  );
}
