import { Deck } from "mtgatool-shared";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory, useParams } from "react-router-dom";

import { ReactComponent as BackIcon } from "../../../assets/images/svg/back.svg";
import { ReactComponent as CopyButton } from "../../../assets/images/svg/copy.svg";
// import { ReactComponent as IconCrown } from "../../../assets/images/svg/crown.svg";
import { ReactComponent as IconEvent } from "../../../assets/images/svg/event.svg";
import { OverlayUpdateMatchState } from "../../../background/store/types";
import reduxAction from "../../../redux/reduxAction";
import copyToClipboard from "../../../utils/copyToClipboard";
import { getCardArtCrop } from "../../../utils/getCardArtCrop";
import getEventPrettyName from "../../../utils/getEventPrettyName";
import getPlayerNameWithoutSuffix from "../../../utils/getPlayerNameWithoutSuffix";
import DeckColorsBar from "../../DeckColorsBar";
import Flex from "../../Flex";
import ManaCost from "../../ManaCost";
import SvgButton from "../../SvgButton";
import Section from "../../ui/Section";
import LiveMatchDeckList from "./LiveMatchDeckList";

export default function LiveMatch() {
  const history = useHistory();
  const dispatch = useDispatch();
  const params = useParams<{ id: string }>();

  const [matchState, setMatchState] = useState<null | OverlayUpdateMatchState>(
    null
  );

  const liveMatchKey = `livematch-${params.id}`;

  useEffect(() => {
    const liveMatchListener =
      window.toolDb.addKeyListener<OverlayUpdateMatchState>(
        liveMatchKey,
        (msg: any) => {
          if (msg && msg.type === "put") {
            setMatchState(msg.v);
          }
        }
      );

    window.toolDb.subscribeData(liveMatchKey);
    window.toolDb.getData(liveMatchKey);

    return () => {
      if (liveMatchListener) {
        window.toolDb.removeKeyListener(liveMatchListener);
      }
    };
  }, []);

  const goBack = (): void => {
    history.push("/home");
    reduxAction(dispatch, {
      type: "SET_BACK_GRPID",
      arg: null,
    });
  };

  const copyOppName = useCallback((): void => {
    if (matchState) {
      copyToClipboard(matchState.opponent.name);
      reduxAction(dispatch, {
        type: "SET_POPUP",
        arg: {
          text: "Opponent's name copied to clipboard.",
          duration: 5000,
          time: new Date().getTime(),
        },
      });
    }
  }, [matchState]);

  const playerDeck = new Deck(matchState?.playerDeck);

  return (
    <>
      {matchState ? (
        <>
          <div
            className="matches-top"
            style={{
              backgroundImage: `url("${getCardArtCrop(playerDeck.tile)}")`,
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
          <Section className="live-match-header">
            <Flex>
              <div className="match-player-name">
                vs {getPlayerNameWithoutSuffix(matchState.opponent.name)}
              </div>
              <SvgButton
                style={{ margin: "auto 2px" }}
                svg={CopyButton}
                onClick={copyOppName}
              />
            </Flex>

            <Flex>
              Game {matchState.gameInfo.gameNumber}, Turn{" "}
              {matchState.turnInfo.turnNumber}
            </Flex>
            <Flex>
              {matchState.turnInfo.phase?.replace("Phase_", "")} Phase
            </Flex>
            <Flex>{matchState.turnInfo.step?.replace("Step_", "")} Step</Flex>

            <Flex>
              <IconEvent
                style={{ margin: "auto 16px auto 8px" }}
                fill="var(--color-icon)"
              />
              <div>{getEventPrettyName(matchState.eventId)}</div>
            </Flex>
          </Section>
          <LiveMatchDeckList matchState={matchState} />
        </>
      ) : (
        <></>
      )}
    </>
  );
}
