/**
 * Tie the local store to one account, and wipe it when a different one signs in.
 *
 * The local KV is not namespaced per user. Keys used to be `:${pubKey}.${key}`
 * under tool-db's ECDSA identity; when tool-db was removed the per-identity part
 * went with it and nothing replaced it, so everything now lives under the fixed
 * `:local.` prefix (see `store.ts`). Nothing clears it on login either.
 *
 * That turns "sign in as someone else on this machine" into data crossing
 * between accounts, in both directions:
 *
 *   - `syncMatches` reads every match under `:local.` and pushes whatever the
 *     cloud is missing. Signing in as B uploads A's history to B — and because
 *     `pushMatch` calls `ensureArenaAccount`, it also links A's Arena persona to
 *     B's account.
 *   - `hydrateFromCloud` writes what it pulls back into the same shared prefix,
 *     so B's data lands in the store A is still using, and A pushes it up as its
 *     own on the next sign-in.
 *
 * The desktop app really is single-user-per-device, so rather than reintroducing
 * a per-user namespace (which needs a migration for every existing install, and
 * leaves stale copies on disk), the store records which account owns it and is
 * cleared when that changes.
 *
 * Offline claims the store too, as OFFLINE_OWNER. Without that, "no owner" would
 * be ambiguous between two cases that must be treated differently: matches
 * collected offline on this device (the signer-in's own — should sync up) and
 * another account's data (must not). Offline never takes the store off a real
 * owner, so signing out, playing offline and signing back in is unaffected.
 *
 * An unset owner therefore only means a store written before this shipped. Those
 * are adopted rather than wiped — on the overwhelmingly common single-user
 * device that is the right call, and it is no worse than the behaviour it
 * replaces. Every switch after that is protected.
 */
import { kvClear, kvGet, kvPut } from "./localKV";

/** Not user-namespaced: it is the thing that decides what the namespace holds. */
const OWNER_KEY = "local-store-owner";

/** Placeholder owner for a store built up in offline mode, with no account. */
export const OFFLINE_OWNER = "offline";

export type ClaimResult = "same-owner" | "adopted" | "cleared";

export async function getLocalStoreOwner(): Promise<string | null> {
  return kvGet<string>(OWNER_KEY);
}

/**
 * Record `userId` as the owner of the local store, clearing it first if it
 * currently belongs to someone else.
 *
 * Must run BEFORE `hydrateFromCloud` and `syncMatches` on every sign-in, or the
 * wipe would take the freshly pulled data with it.
 *
 * `userId` is the Supabase auth id, or null when continuing offline — offline
 * never claims the store, so signing in afterwards still finds the owner it
 * expects and keeps the matches played in the meantime.
 */
export default async function claimLocalStore(
  userId: string | null
): Promise<ClaimResult> {
  const owner = await getLocalStoreOwner();

  // Offline: take an unowned store so the matches played now are attributable,
  // but never take one that already belongs to an account.
  if (!userId) {
    if (!owner) {
      await kvPut(OWNER_KEY, OFFLINE_OWNER);
      return "adopted";
    }
    return "same-owner";
  }

  if (owner === userId) return "same-owner";

  // Unowned (predates this) or built offline on this device — both are the
  // signer-in's to keep, and their matches should sync up.
  if (!owner || owner === OFFLINE_OWNER) {
    await kvPut(OWNER_KEY, userId);
    return "adopted";
  }

  // A different account owned this store. Everything under `:local.` is theirs;
  // it stays in their cloud, and this device starts clean.
  await kvClear();
  await kvPut(OWNER_KEY, userId);
  return "cleared";
}
