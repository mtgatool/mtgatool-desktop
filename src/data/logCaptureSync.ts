/* eslint-disable no-console */
/**
 * The network half of log capture: reading the active captures at login and
 * uploading what the parser claimed.
 *
 * Separate from `logCapture` on purpose — that module runs in the background
 * window and must not pull in a Supabase client (see the note there). This one
 * is only ever imported by the main window.
 */
import postChannelMessage from "../broadcastChannel/postChannelMessage";
import { LogCapture } from "./logCapture";
import supabase from "./supabase";

/**
 * Fetch the active captures and hand them to the parser.
 *
 * Best-effort in every direction: a failure means capture nothing, which is
 * also the default. Called once per login.
 */
export async function loadLogCaptures(): Promise<void> {
  try {
    const { data, error } = await (supabase as any)
      .from("log_captures")
      .select("id, labels")
      .eq("active", true);

    if (error || !data?.length) return;

    postChannelMessage({
      type: "LOG_CAPTURE_CONFIG",
      value: data as LogCapture[],
    });
  } catch (e) {
    // Nothing to do: no config means no capture.
  }
}

/** Upload one captured entry to each capture that claimed it. */
export async function submitLogCapture(value: {
  captureIds: string[];
  label: string;
  hash?: string;
  timestamp?: string;
  arrow?: string;
  type?: string;
  jsonString?: string;
  size?: number;
  position?: number;
}): Promise<void> {
  await Promise.all(
    (value.captureIds || []).map(async (captureId) => {
      try {
        const { error } = await (supabase as any).rpc("submit_log_capture", {
          p_capture_id: captureId,
          p_label: value.label,
          p_hash: value.hash ?? null,
          p_timestamp: value.timestamp ?? null,
          p_arrow: value.arrow ?? null,
          p_type: value.type ?? null,
          p_json_string: value.jsonString ?? null,
          p_size: value.size ?? null,
          p_position: value.position ?? null,
        });
        if (!error) console.log(`[log-capture] sent ${value.label}`);
      } catch (e) {
        // Opportunistic debugging data is never worth a retry loop.
      }
    })
  );
}
