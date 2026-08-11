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
import sha1 from "../utils/sha1";
import textRandom from "../utils/textRandom";
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
  owner: SharedDeckOwner | null;
  winrate: { wins: number; losses: number } | null;
}
/* eslint-enable camelcase */

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

    const existing = await getMyDeckShare(deck.id);
    const shareId =
      existing?.shareId || sha1(`${textRandom(64)}-${new Date().getTime()}`);

    const { error } = await supabase.from("shared_decks").upsert(
      {
        share_id: shareId,
        user_id: userId,
        deck_id: deck.id,
        deck: snapshotOf(deck) as unknown as Json,
        include_winrate: includeWinrate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,deck_id" }
    );
    if (error) {
      console.error("[sharedDecks] shareDeck:", error.message);
      return null;
    }
    return { shareId, includeWinrate };
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
