import { useMemo } from "react";

import { ReactComponent as MacClose } from "../assets/images/svg/mac-close.svg";
import { ReactComponent as WinClose } from "../assets/images/svg/win-close.svg";
import RankIcon from "../components/RankIcon";
import TopBar from "../components/TopBar";
import useCard from "../hooks/useCard";
import { useCardArtCrop } from "../hooks/useCardImage";
import { CardCast, InternalMatch, MatchPlayerStats } from "../types";
import remote from "../utils/electron/remoteWrapper";
import getLocalSetting from "../utils/getLocalSetting";
import LifeBar from "./LifeBar";
import StatBar from "./StatBar";
import Timeline from "./Timeline";

/** The grpId with the highest total in a `damage` map, or 0 for none. */
function topDamage(stats: MatchPlayerStats | undefined): number {
  if (!stats?.damage) return 0;
  const entries = Object.entries(stats.damage);
  if (entries.length === 0) return 0;
  const [grpId] = entries.reduce((best, cur) =>
    cur[1] > best[1] ? cur : best
  );
  return Number(grpId);
}

/** The grpId cast most often by `seat`, or 0 for none. */
function topCast(casts: CardCast[], seat: number): number {
  const counts = new Map<number, number>();
  casts
    .filter((c) => c.player === seat)
    .forEach((c) => counts.set(c.grpId, (counts.get(c.grpId) || 0) + 1));
  if (counts.size === 0) return 0;
  return [...counts.entries()].reduce((best, cur) =>
    cur[1] > best[1] ? cur : best
  )[0];
}

function duration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface CardBadgeProps {
  grpId: number;
  label: string;
}

/** One of the little round "best at X" cards, art-cropped. */
function CardBadge(props: CardBadgeProps): JSX.Element | null {
  const { grpId, label } = props;
  const art = useCardArtCrop(grpId);
  const card = useCard(grpId);
  if (!grpId) return null;

  return (
    <div className="postmatch-badge" title={card?.Name || ""}>
      <div className="postmatch-badge-label">{label}</div>
      <div
        className="postmatch-badge-art"
        style={art ? { backgroundImage: `url(${art})` } : undefined}
      />
    </div>
  );
}

export default function PostMatch(): JSX.Element {
  // Handed over through localStorage by showPostMatchOverview — this window is
  // created in reaction to the same event that carries the match, so a
  // broadcast would arrive before it had finished booting.
  const match = useMemo<InternalMatch | null>(() => {
    try {
      const raw = getLocalSetting("postMatchOverview");
      return raw ? (JSON.parse(raw) as InternalMatch) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const close = (): void => {
    if (remote) remote.getCurrentWindow().close();
  };

  // Transparent windows get the overlay treatment: no title bar, our own close
  // button, and the card itself as the drag handle — a frame around a floating
  // translucent panel looks like a mistake. With transparency off the window is
  // an ordinary opaque one, so it keeps the normal title bar.
  const transparent = useMemo(() => {
    try {
      return !!JSON.parse(getLocalSetting("settings")).overlaysTransparency;
    } catch (e) {
      return false;
    }
  }, []);

  const CloseSVG = process.platform === "darwin" ? MacClose : WinClose;
  const rootClass = `postmatch-root${transparent ? " frameless" : ""}`;

  // The close button has to live *inside* the draggable panel, not beside it:
  // the no-drag carve-out is applied to elements within the drag region, so a
  // sibling laid over the top keeps rendering and hit-testing normally in the
  // page while the window drag swallows the actual click. Positioned fixed so
  // it stays put while the panel scrolls under it.
  const closeButton = transparent ? (
    <div
      className={`postmatch-close ${
        process.platform === "darwin" ? "mac" : "win"
      }`}
      onClick={close}
      title="Close"
    >
      <CloseSVG />
    </div>
  ) : null;

  const topBar = transparent ? null : <TopBar closeCallback={close} />;

  const casts = useMemo<CardCast[]>(
    () =>
      Object.values(match?.gameStats || {}).flatMap((g) => g?.cardsCast || []),
    [match]
  );

  const playerSeat = match?.player?.seat ?? 1;
  const oppSeat = match?.opponent?.seat ?? 2;

  const stats = match?.postStats;
  const pStats = stats?.playerStats;
  const oStats = stats?.oppStats;

  const playerDmg = topDamage(pStats);
  const oppDmg = topDamage(oStats);
  const playerCast = topCast(casts, playerSeat);
  const oppCast = topCast(casts, oppSeat);

  // The match MVP: whichever single card dealt the most damage on either side.
  // It headlines the screen, so it is the one card worth showing as art.
  const mvpGrpId =
    (pStats?.damage?.[playerDmg] || 0) >= (oStats?.damage?.[oppDmg] || 0)
      ? playerDmg
      : oppDmg;
  const mvpArt = useCardArtCrop(mvpGrpId);
  const mvpCard = useCard(mvpGrpId);
  const mvpDamage =
    pStats?.damage?.[mvpGrpId] || oStats?.damage?.[mvpGrpId] || 0;

  const playerCasts = casts.filter((c) => c.player === playerSeat).length;
  const oppCasts = casts.filter((c) => c.player === oppSeat).length;

  if (!match) {
    return (
      <div className={rootClass}>
        {topBar}
        <div className="postmatch-panel postmatch-empty">
          {closeButton}
          No match to show yet.
        </div>
      </div>
    );
  }

  const won = (match.player?.wins || 0) > (match.opponent?.wins || 0);

  return (
    <div className={rootClass}>
      {topBar}

      <div className="postmatch-panel">
        {closeButton}
        <div className="postmatch-logo" title="MTG Arena Tool" />
        {mvpGrpId ? (
          <div
            className="postmatch-mvp"
            style={mvpArt ? { backgroundImage: `url(${mvpArt})` } : undefined}
          >
            <div className="postmatch-mvp-shade">
              <div className="postmatch-mvp-label">Match MVP</div>
              <div className="postmatch-mvp-name">{mvpCard?.Name || ""}</div>
              <div className="postmatch-mvp-sub">{mvpDamage} damage dealt</div>
            </div>
          </div>
        ) : null}

        <div className="postmatch-header">
          <div className="postmatch-player">
            <div className="postmatch-name">
              {match.player?.name?.split("#")[0]}
            </div>
            <RankIcon
              rank={match.player?.rank}
              tier={match.player?.tier}
              step={match.player?.step}
              percentile={match.player?.percentile}
              leaderboardPlace={match.player?.leaderboardPlace}
              format="constructed"
            />
          </div>

          <div className="postmatch-center">
            <div className={`postmatch-result ${won ? "won" : "lost"}`}>
              {match.player?.wins}:{match.opponent?.wins}
            </div>
            <div className="postmatch-dim">Duration</div>
            <div className="postmatch-duration">
              {duration(match.duration || 0)}
            </div>
          </div>

          <div className="postmatch-player">
            <div className="postmatch-name">
              {match.opponent?.name?.split("#")[0]}
            </div>
            <RankIcon
              rank={match.opponent?.rank}
              tier={match.opponent?.tier}
              step={match.opponent?.step}
              percentile={match.opponent?.percentile}
              leaderboardPlace={match.opponent?.leaderboardPlace}
              format="constructed"
            />
          </div>
        </div>

        <div className="postmatch-badges">
          <div className="postmatch-badges-side">
            <CardBadge grpId={playerDmg} label="DMG" />
            <CardBadge grpId={playerCast} label="Cast" />
          </div>
          <div className="postmatch-badges-sep" />
          <div className="postmatch-badges-side">
            <CardBadge grpId={oppDmg} label="DMG" />
            <CardBadge grpId={oppCast} label="Cast" />
          </div>
        </div>

        {/* Everything below comes from postStats, which matches recorded before
            the overview existed do not have. Those sections are dropped rather
            than drawn empty. */}
        {stats ? (
          <>
            <LifeBar
              player={pStats?.lifeTotals || []}
              opp={oStats?.lifeTotals || []}
            />
            <StatBar title="Cards Cast" player={playerCasts} opp={oppCasts} />
            <StatBar
              title="Life Gained"
              player={pStats?.lifeGained || 0}
              opp={oStats?.lifeGained || 0}
            />
            <StatBar
              title="Life Lost"
              player={pStats?.lifeLost || 0}
              opp={oStats?.lifeLost || 0}
            />
            <StatBar
              title="Mana Used"
              player={pStats?.manaUsed || 0}
              opp={oStats?.manaUsed || 0}
            />
            <Timeline
              heat={stats.statsHeatMap || []}
              playerSeat={playerSeat}
              totalTurns={stats.totalTurns || 0}
            />
          </>
        ) : (
          <StatBar title="Cards Cast" player={playerCasts} opp={oppCasts} />
        )}

        <div className="postmatch-footer">by MTG Arena Tool</div>
      </div>
    </div>
  );
}
