import { OverlayUpdateMatchState } from "../background/store/types";
import { OverlaySettings } from "../common/defaultConfig";
import ActionLog from "../components/action-log-v2";
import { ActionLogV2 } from "../components/action-log-v2/types";
import OverlayDeckList from "../components/OverlayDeckList";
import { OVERLAY_DRAFT, OVERLAY_LOG } from "../constants";
import { InternalDraftv2 } from "../types";
import Chances from "../types/chances";
import { DbDraftVote } from "../types/dbTypes";
import getPlayerNameWithoutSuffix from "../utils/getPlayerNameWithoutSuffix";
import Deck from "../utils/mtga/deck";
import Clock from "./Clock";
import DraftOverlay from "./DraftOverlay";

interface OverlayContentProps {
  settings: OverlaySettings;
  deck?: Deck;
  subTitle: string;
  odds?: Chances;
  matchState?: OverlayUpdateMatchState;
  actionLog?: ActionLogV2 | null;
  draftState?: InternalDraftv2;
  draftVotes?: Record<string, DbDraftVote>;
  // The overlay window shows the QR share toggle; the public live viewer must
  // not (it can't re-share, and has no window to toggle).
  shareControls?: boolean;
}

/**
 * The inner render of an overlay — deck list, action log, draft picks and the
 * match clock — chosen by `settings.mode`. Shared by the desktop overlay
 * window (overlay/index.tsx) and the public live-share viewer (LiveShareView)
 * so what a viewer sees is exactly what the overlay renders. Purely
 * presentational: no electron/remote access, so it runs in the web build too.
 */
export default function OverlayContent(
  props: OverlayContentProps
): JSX.Element {
  const {
    settings,
    deck,
    subTitle,
    odds,
    matchState,
    actionLog,
    draftState,
    draftVotes,
    shareControls = true,
  } = props;

  return (
    <>
      {settings.mode === OVERLAY_DRAFT && draftState && (
        <DraftOverlay state={draftState} votes={draftVotes || {}} />
      )}
      {deck && settings.mode !== OVERLAY_LOG && (
        <OverlayDeckList
          deck={deck}
          settings={settings}
          subTitle={subTitle}
          cardOdds={odds}
          setOddsCallback={(): void => {
            //
          }}
          shareControls={shareControls}
        />
      )}
      {settings.mode === OVERLAY_LOG && actionLog && (
        <ActionLog actionLog={actionLog} />
      )}
      {!!settings.clock && matchState && !settings.collapsed && (
        <Clock
          matchBeginTime={new Date(matchState.beginTime)}
          oppName={getPlayerNameWithoutSuffix(matchState.opponent.name || "")}
          playerSeat={matchState.player ? matchState.player.seat : 1}
          priorityTimers={matchState.priorityTimers}
          turnPriority={matchState.currentPriority}
        />
      )}
    </>
  );
}
