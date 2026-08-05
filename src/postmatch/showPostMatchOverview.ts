import store from "../redux/stores/rendererStore";
import { InternalMatch } from "../types";
import setLocalSetting from "../utils/setLocalSetting";
import createPostMatchWindow from "./createPostMatchWindow";

/**
 * Hand a finished match to the overview window and open it.
 *
 * Gated on `overlayOverview` — the "Show post-match overview" toggle, which
 * has been in Settings (and defaulted to on) the whole time this screen did
 * not exist.
 */
export default function showPostMatchOverview(match: InternalMatch): void {
  if (!store.getState().settings.overlayOverview) return;
  if (!match) return;

  // The action log is by far the largest field and the overview does not read
  // it; everything the screen needs lives in postStats, gameStats and the two
  // player records.
  const { actionLog: _actionLog, ...overview } = match;

  try {
    setLocalSetting("postMatchOverview", JSON.stringify(overview));
  } catch (e) {
    // A match too large to stringify is not worth taking the app down for.
    // eslint-disable-next-line no-console
    console.log("Could not stash the post-match overview", e);
    return;
  }

  createPostMatchWindow();
}
