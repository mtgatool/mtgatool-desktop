/**
 * Supporter entitlement — who is a Patreon backer, and at what tier.
 *
 * The answer lives in the `entitlements` table, written server-side only (see
 * the patreon_entitlements migration). A user can read their own row and
 * nothing else, so this is a single indexed lookup on login.
 *
 * Cached in the local KV so the badge survives a cold start and an offline
 * session. The cache is deliberately trusted for a while: one failed read must
 * not blink a supporter's badge off and on again. It expires eventually so a
 * lapsed pledge cannot linger forever on a machine that never reconnects.
 */
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { getData, putData } from "./store";
import supabase from "./supabase";

export type SupporterTier = 0 | 1 | 2 | 3 | 4;

/**
 * Tier names, matching the rings the website already puts around patron
 * avatars: Casual, then $5 / $10 / $20.
 */
export const TIER_NAMES: Record<number, string> = {
  1: "Casual",
  2: "Standard",
  3: "Modern",
  4: "Legacy",
};

export interface Entitlement {
  supporter: boolean;
  tier: number;
  /** ms epoch; 0 when the pledge is current and has no end. */
  expiresAt: number;
  /** ms epoch of the last successful read from the cloud. */
  checkedAt: number;
}

export const FREE_ENTITLEMENT: Entitlement = {
  supporter: false,
  tier: 0,
  expiresAt: 0,
  checkedAt: 0,
};

/** How long a cached answer is honoured without a fresh read. */
export const ENTITLEMENT_GRACE_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Namespaced on purpose. claimLocalStore wipes the per-user prefix when a
 * different account signs in on the same machine; an unnamespaced key would
 * carry one person's supporter status onto the next account.
 */
const KEY = "entitlement";

export async function loadCachedEntitlement(): Promise<Entitlement | null> {
  try {
    return await getData<Entitlement>(KEY, true);
  } catch {
    return null;
  }
}

export async function saveCachedEntitlement(e: Entitlement): Promise<void> {
  try {
    await putData(KEY, e, true);
  } catch {
    // A cache write failing is not worth surfacing.
  }
}

export async function clearEntitlement(): Promise<void> {
  try {
    await putData(KEY, FREE_ENTITLEMENT, true);
  } catch {
    // as above
  }
}

/** Whether a cached answer is still young enough to act on. */
export function isEntitlementUsable(e: Entitlement, now = Date.now()): boolean {
  return e.checkedAt > 0 && now - e.checkedAt < ENTITLEMENT_GRACE_MS;
}

/**
 * Read the entitlement for the signed-in user.
 *
 * Returns null when there is nothing to say — no session, offline, or the read
 * failed — so callers can keep whatever they had rather than treating a network
 * blip as "not a supporter".
 */
export async function fetchEntitlement(): Promise<Entitlement | null> {
  try {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return null;

    const { data, error } = await supabase
      .from("entitlements")
      .select("tier, active, expires_at")
      .eq("user_id", uid)
      .maybeSingle();

    if (error) return null;

    const now = Date.now();
    const expiresAt = data?.expires_at
      ? new Date(data.expires_at as string).getTime()
      : 0;
    // No row at all is a perfectly good answer: this account is not a patron.
    const active =
      !!data?.active &&
      (expiresAt === 0 || expiresAt > now) &&
      (data?.tier ?? 0) > 0;

    return {
      supporter: active,
      tier: active ? (data?.tier as number) : 0,
      expiresAt,
      checkedAt: now,
    };
  } catch {
    return null;
  }
}

/**
 * Refresh from the cloud, cache it, and put it into Redux.
 *
 * Falls back to the cached answer when the cloud says nothing (offline, or no
 * session yet), and only degrades to free once that cache has aged out. Never
 * throws — a failure here must not break login.
 */
export async function refreshEntitlement(): Promise<Entitlement> {
  const fresh = await fetchEntitlement();

  let result: Entitlement;
  if (fresh) {
    result = fresh;
    await saveCachedEntitlement(fresh);
  } else {
    const cached = await loadCachedEntitlement();
    result = cached && isEntitlementUsable(cached) ? cached : FREE_ENTITLEMENT;
  }

  reduxAction(store.dispatch, {
    type: "SET_PATREON",
    arg: {
      patreon: result.supporter,
      patreonTier: result.tier,
      patreonExpires: result.expiresAt,
      patreonChecked: result.checkedAt,
    },
  });

  return result;
}
