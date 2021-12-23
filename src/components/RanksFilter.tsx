/* eslint-disable no-bitwise */
import { getRankIndex16 } from "mtgatool-shared";
import { useState } from "react";

import {
  RANK_BRONZE,
  RANK_DIAMOND,
  RANK_GOLD,
  RANK_MYTHIC,
  RANK_PLATINUM,
  RANK_SILVER,
} from "./views/history/getRankFilterVal";

interface RanksFilterProps {
  initialState: number;
  callback: (filter: number) => void;
}

function getRankFromBits(bits: number) {
  if (bits === RANK_BRONZE) return "Bronze";
  if (bits === RANK_SILVER) return "Silver";
  if (bits === RANK_GOLD) return "Gold";
  if (bits === RANK_PLATINUM) return "Platinum";
  if (bits === RANK_DIAMOND) return "Diamond";
  if (bits === RANK_MYTHIC) return "Mythic";
  return "Unranked";
}

export default function RanksFilter(props: RanksFilterProps): JSX.Element {
  const { initialState, callback } = props;
  const [ranksFilter, setRanksFilter] = useState(initialState);

  const setFilter = (newRanks: number): void => {
    setRanksFilter(newRanks);
    callback(newRanks);
  };

  return (
    <div className="rank-filters">
      {[
        RANK_SILVER,
        RANK_BRONZE,
        RANK_GOLD,
        RANK_PLATINUM,
        RANK_DIAMOND,
        RANK_MYTHIC,
      ].map((rankBits) => {
        const rankClass = getRankFromBits(rankBits);
        return (
          <div
            key={`rank-filter-${rankBits}`}
            onClick={(): void => {
              const newRanks = ranksFilter ^ rankBits;
              setFilter(newRanks);
            }}
            style={{
              backgroundPosition: `${getRankIndex16(rankClass) * -16}px 0px`,
            }}
            className={`ranks-16 rank-filter ${
              ranksFilter & rankBits ? "filter-on" : ""
            }`}
          />
        );
      })}
    </div>
  );
}
