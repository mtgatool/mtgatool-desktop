/**
 * Whether the signed-in user is a Patreon supporter, and at what tier.
 *
 * The single place allowed to decide what the stored tier means. The slot starts
 * at -1 ("not looked up yet") and the server sends 0 for "looked up, not a
 * patron" — anything checking truthiness or `=== -1` elsewhere would break the
 * moment a real 0 arrives, so nothing else reads the slot directly.
 */
import { useSelector } from "react-redux";

import { AppState } from "../redux/stores/rendererStore";

export interface SupporterState {
  isSupporter: boolean;
  /** 0 when not a supporter; 1..4 Casual/Standard/Modern/Legacy. */
  tier: number;
  /** No cloud answer yet this session — treat "not a supporter" as provisional. */
  unverified: boolean;
}

export default function useSupporter(minTier = 1): SupporterState {
  const patreon = useSelector((state: AppState) => state.renderer.patreon);

  const tier = patreon.patreonTier > 0 ? patreon.patreonTier : 0;

  return {
    isSupporter: patreon.patreon && tier >= minTier,
    tier,
    unverified: !patreon.patreonChecked,
  };
}
