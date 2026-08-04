/* eslint-disable camelcase */
/**
 * Explore meta data (pull-only, read-only).
 *
 * Reads the `explore_meta_cards` / `explore_meta_events` materialized views —
 * what the *opponents* were playing, aggregated per event. The sample comes from
 * ~1030 distinct opponent accounts rather than from the handful of people who
 * run the tracker, so it describes the actual ladder instead of our own user mix.
 *
 * Presence is "share of observed matches where the card showed up", never a copy
 * count: `oppDeck` quantities are inferred, not counted, so they are not exposed.
 * `winrate` belongs to the deck that played the card, not to us.
 *
 * Both views are refreshed hourly by pg_cron.
 */
import supabase from "./supabase";

export interface ExploreMetaCardRow {
  event_id: string;
  grpid: number;
  seen_in: number;
  observed_matches: number;
  presence: number;
  wins: number;
  losses: number;
  winrate: number;
  last_seen: string | null;
}

export interface ExploreMetaEventRow {
  event_id: string;
  matches: number;
  observed_matches: number;
  opponents: number;
  last_played: string | null;
}

export async function fetchExploreMetaCards(
  eventId: string
): Promise<ExploreMetaCardRow[]> {
  try {
    // The MVs aren't in the generated types; cast the builder.
    const { data, error } = await (supabase as any)
      .from("explore_meta_cards")
      .select("*")
      .eq("event_id", eventId)
      .order("seen_in", { ascending: false });
    if (error) {
      console.error("[fetchExploreMetaCards]", error.message);
      return [];
    }
    return (data ?? []) as ExploreMetaCardRow[];
  } catch (e) {
    console.error("[fetchExploreMetaCards] threw:", e);
    return [];
  }
}

export async function fetchExploreMetaEvents(): Promise<ExploreMetaEventRow[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("explore_meta_events")
      .select("*");
    if (error) {
      console.error("[fetchExploreMetaEvents]", error.message);
      return [];
    }
    return (data ?? []) as ExploreMetaEventRow[];
  } catch (e) {
    console.error("[fetchExploreMetaEvents] threw:", e);
    return [];
  }
}
