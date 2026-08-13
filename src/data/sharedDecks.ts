/**
 * Public deck sharing. A share is a row in `shared_decks`: an unguessable
 * token mapping to a SNAPSHOT of the decklist (played decks only exist in
 * local stats, so there is nothing server-side to link to — re-sharing
 * refreshes the snapshot) plus a live winrate flag. Anonymous viewers read
 * through the `get_shared_deck` RPC, which exposes only public fields and
 * respects the owner's private-mode profile.
 */
import { StatsDeck } from "../types/dbTypes";
import { v2cardsList } from "../types/deck";
import { getActiveUserId } from "./cloudSync";
import { Json } from "./database.types";
import supabase from "./supabase";

/** The decklist snapshot stored in (and served from) a share row. */
export interface SharedDeckSnapshot {
  name: string;
  deckTileId: number;
  colors: number;
  mainDeck: v2cardsList;
  sideboard: v2cardsList;
  commanders?: v2cardsList;
  companions?: v2cardsList;
}

// Field names come from the RPC's jsonb, hence the database spelling.
/* eslint-disable camelcase */
export interface SharedDeckOwner {
  username: string | null;
  avatar_url: string | null;
  supporter_tier: number;
}

export interface SharedDeckPayload {
  deck: SharedDeckSnapshot;
  updated_at: string;
  /** Arena deck id, for the recent-matches list. Null for private owners. */
  deck_id: string | null;
  owner: SharedDeckOwner | null;
  winrate: { wins: number; losses: number } | null;
}
/* eslint-enable camelcase */

/** 160 bits from the platform CSPRNG, hex — an unguessable capability. */
function newShareToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function snapshotOf(deck: StatsDeck): SharedDeckSnapshot {
  return {
    name: deck.name,
    deckTileId: deck.deckTileId,
    colors: deck.colors,
    mainDeck: deck.mainDeck,
    sideboard: deck.sideboard,
    commanders: deck.commanders,
    companions: deck.companions,
  };
}

export interface MyDeckShare {
  shareId: string;
  includeWinrate: boolean;
}

/** The signed-in user's existing share for a deck, if any. */
export async function getMyDeckShare(
  deckId: string
): Promise<MyDeckShare | null> {
  try {
    const userId = await getActiveUserId();
    if (!userId) return null;
    const { data, error } = await supabase
      .from("shared_decks")
      .select("*")
      .eq("deck_id", deckId)
      .maybeSingle();
    if (error || !data) return null;
    return { shareId: data.share_id, includeWinrate: data.include_winrate };
  } catch {
    return null;
  }
}

/**
 * Create (or refresh) the public share for a deck. Keeps an existing link
 * stable: re-sharing updates the snapshot and settings under the same token.
 */
export async function shareDeck(
  deck: StatsDeck,
  includeWinrate: boolean
): Promise<MyDeckShare | null> {
  try {
    const userId = await getActiveUserId();
    if (!userId || !deck.id) return null;

    // Insert-then-update rather than a blind upsert: an upsert on
    // (user_id, deck_id) would overwrite share_id — the primary key the
    // public link is made of — killing an existing link on every re-share
    // (and in any race). The insert only wins when no share exists; the
    // update refreshes content without ever touching the token.
    await supabase.from("shared_decks").upsert(
      {
        share_id: newShareToken(),
        user_id: userId,
        deck_id: deck.id,
        deck: snapshotOf(deck) as unknown as Json,
        include_winrate: includeWinrate,
      },
      { onConflict: "user_id,deck_id", ignoreDuplicates: true }
    );
    const { error } = await supabase
      .from("shared_decks")
      .update({
        deck: snapshotOf(deck) as unknown as Json,
        include_winrate: includeWinrate,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("deck_id", deck.id);
    if (error) {
      console.error("[sharedDecks] shareDeck:", error.message);
      return null;
    }
    const share = await getMyDeckShare(deck.id);
    if (!share) return null;
    return { shareId: share.shareId, includeWinrate };
  } catch (e) {
    console.error("[sharedDecks] shareDeck threw:", e);
    return null;
  }
}

/** Delete the share; the link stops working immediately. */
export async function stopSharingDeck(deckId: string): Promise<boolean> {
  try {
    const userId = await getActiveUserId();
    if (!userId) return false;
    const { error } = await supabase
      .from("shared_decks")
      .delete()
      .eq("user_id", userId)
      .eq("deck_id", deckId);
    if (error) {
      console.error("[sharedDecks] stopSharingDeck:", error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Resolve a share token — public, works without a session. */
export async function fetchSharedDeck(
  shareId: string
): Promise<SharedDeckPayload | null> {
  try {
    const { data, error } = await supabase.rpc("get_shared_deck", {
      p_share_id: shareId,
    });
    if (error || !data) return null;
    return data as unknown as SharedDeckPayload;
  } catch {
    return null;
  }
}

/** The public URL a share token resolves to. */
export function sharedDeckUrl(shareId: string): string {
  return `https://app.mtgatool.com/share/deck/${shareId}`;
}
