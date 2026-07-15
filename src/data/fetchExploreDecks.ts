/* eslint-disable camelcase */
/**
 * Explore data (pull-only, read-only).
 *
 * Reads the `explore_decks` materialized view — cross-user, deck-level
 * aggregates grouped by deck hash per event, exposing only aggregates (winrate,
 * games, distinct pilots, colors, a representative decklist). A deck only
 * appears once it has >= 10 matches from >= 2 pilots, so no individual's data
 * is ever surfaced. The view is refreshed hourly by pg_cron.
 */
import { InternalDeck } from "../types";
import supabase from "./supabase";

export interface ExploreDeckRow {
  event_id: string;
  deck_hash: string;
  games: number;
  wins: number;
  losses: number;
  pilots: number;
  winrate: number;
  colors: number | null;
  last_played: string | null;
  deck: InternalDeck;
}

export default async function fetchExploreDecks(
  eventId?: string
): Promise<ExploreDeckRow[]> {
  try {
    // The MV isn't in the generated types; cast the builder.
    let query = (supabase as any).from("explore_decks").select("*");
    if (eventId) query = query.eq("event_id", eventId);
    const { data, error } = await query;
    if (error) {
      console.error("[fetchExploreDecks]", error.message);
      return [];
    }
    return (data ?? []) as ExploreDeckRow[];
  } catch (e) {
    console.error("[fetchExploreDecks] threw:", e);
    return [];
  }
}
