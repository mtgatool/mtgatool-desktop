import { OverlaySettings } from "../common/defaultConfig";

/**
 * The full payload a live-share viewer needs to render OverlayContent for any
 * mode.
 *
 * Kept in its own module (no Supabase import) so both the overlay window — which
 * only *sends* this over the broadcast channel — and the background window —
 * which does the authenticated write — can share the shape without the overlay
 * bundle pulling in the Supabase client.
 */
export interface OverlaySharePayload {
  matchState: unknown;
  settings: OverlaySettings;
  /**
   * Whether a game is being played right now.
   *
   * The viewer cannot infer this: the payload of a finished match looks exactly
   * like the payload of a live one. Staleness alone does not cover it either,
   * because an overlay set to show always keeps publishing between games.
   */
  matchInProgress?: boolean;
  actionLog?: unknown;
  draftState?: unknown;
  draftVotes?: unknown;
}
