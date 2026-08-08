import { TIER_NAMES } from "../data/entitlement";
import useSupporter from "../hooks/useSupporter";
import openExternal from "../utils/openExternal";
import PatreonLogo from "./PatreonLogo";
import SupporterTierIcon from "./SupporterTierIcon";

const PATREON_URL = "https://www.patreon.com/cw/mtgatool";

/**
 * The Patreon mark beside the username, which becomes a tier badge once the
 * account is linked to a pledge.
 *
 * It is always present rather than appearing only for supporters: for everyone
 * else it is the way in, and a badge nobody ever sees before they have one is a
 * badge nobody knows exists.
 *
 * Tier colours match the rings the website already draws around patron avatars,
 * so the two surfaces agree on what Casual/Standard/Modern/Legacy look like.
 */
interface SupporterBadgeProps {
  /** Override the signed-in user's own tier, for showing someone else's. */
  tier?: number;
}

export default function SupporterBadge({
  tier: tierProp,
}: SupporterBadgeProps): JSX.Element {
  const self = useSupporter();
  const tier = tierProp ?? (self.isSupporter ? self.tier : 0);
  const name = TIER_NAMES[tier];

  return (
    <div
      className={`supporter-badge${tier > 0 ? ` tier-${tier}` : ""}`}
      title={
        name
          ? `${name} supporter — thank you!`
          : "Support MTG Arena Tool on Patreon"
      }
      onClick={(): void => openExternal(PATREON_URL)}
    >
      {/* The Patreon mark is the invitation; once there is a pledge the badge
          shows what tier it is. */}
      {tier > 0 ? <SupporterTierIcon tier={tier} /> : <PatreonLogo />}
    </div>
  );
}
