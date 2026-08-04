import { ExploreMetaCardRow } from "../../../data/fetchExploreMeta";
import useHoverCard from "../../../hooks/useHoverCard";
import { DbCardDataV2 } from "../../../types";
import { getCardArtCrop } from "../../../utils/getCardArtCrop";
import getWinrateClass from "../../../utils/getWinrateClass";

/**
 * One card in the opponent meta: art crop, with the numbers on a badge under it.
 *
 * The art carries identity, so the badge only has to carry magnitude — presence
 * as the headline, then win rate and sample size. Hovering shows the full card
 * through the usual global hover popup.
 */
export default function ExploreMetaCard({
  row,
  card,
  maxPresence,
}: {
  row: ExploreMetaCardRow;
  card: DbCardDataV2;
  maxPresence: number;
}): JSX.Element {
  const [hoverIn, hoverOut] = useHoverCard(card.GrpId);

  return (
    <div
      className="explore-meta-tile"
      onMouseEnter={hoverIn}
      onMouseLeave={hoverOut}
    >
      <div
        className="explore-meta-tile-art"
        style={{ backgroundImage: `url("${getCardArtCrop(card.GrpId)}")` }}
      />

      <div className="explore-meta-tile-body">
        <div className="explore-meta-tile-name" title={card.Name}>
          {card.Name}
        </div>

        <div
          className="explore-meta-tile-bar"
          title={`seen in ${row.seen_in} of ${row.observed_matches} matches`}
        >
          <div
            className="explore-meta-tile-bar-fill"
            style={{ width: `${(row.presence / maxPresence) * 100}%` }}
          />
        </div>

        <div className="explore-meta-tile-stats">
          <span className="explore-meta-tile-presence">
            {row.presence.toFixed(1)}%
          </span>
          <span
            className={getWinrateClass(row.winrate / 100, true)}
            title={`sample size: ${row.wins + row.losses} games`}
          >
            {row.winrate.toFixed(0)}% WR
          </span>
          <span className="explore-meta-tile-n">{row.seen_in}</span>
        </div>
      </div>
    </div>
  );
}
