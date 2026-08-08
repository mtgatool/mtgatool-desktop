import { useEffect, useRef, useState } from "react";

import globalData from "../../../utils/globalData";

type Read = typeof globalData.readerReads[number];

/**
 * One bar per slice of time, not per read.
 *
 * Indexing by read looks similar and means something quite different: the chart
 * stops dead whenever nothing is happening, and a busy moment shoves a minute
 * of history off the end in under a second. Neither tells you *when*. Bucketing
 * by time makes the axis an axis — the strip advances at the same rate however
 * busy the reader is, and a gap is a real gap.
 */
const BUCKET_MS = 250;
const BARS = 60;
/** So the window is stated somewhere rather than inferred. */
const WINDOW_LABEL = `${(BUCKET_MS * BARS) / 1000}s`;

/** Anything at or above this is drawn full height. */
const SLOW_MS = 200;

interface Bucket {
  /** Slowest read that finished in this slice; 0 when none did. */
  ms: number;
  count: number;
  kind: "memory" | "log" | "failed" | "none";
  /** What to call it on hover. */
  label: string;
  /** When the slice ended, so whole seconds can be marked on the axis. */
  at: number;
}

const EMPTY = (at: number): Bucket => ({
  ms: 0,
  count: 0,
  kind: "none",
  label: "nothing read",
  at,
});

/**
 * Where to draw the calibration lines, in milliseconds.
 *
 * Without them a tall bar means "taller than the other bars" and nothing else.
 * Two is enough to read the scale off and few enough not to clutter it.
 */
const GRIDLINES = [10, 50];

function summarise(reads: Read[], at: number): Bucket {
  if (!reads.length) return EMPTY(at);
  // A failure matters more than either kind of success, and a memory read is
  // rarer and more interesting than the log chatter it would otherwise hide.
  const failed = reads.find((r) => !r.ok);
  const memory = reads.find((r) => r.kind === "memory");
  const lead = failed || memory || reads[reads.length - 1];
  return {
    ms: reads.reduce((max, r) => Math.max(max, r.ms), 0),
    count: reads.length,
    kind: failed ? "failed" : (lead.kind as "memory" | "log"),
    label:
      reads.length === 1 ? lead.name : `${lead.name} +${reads.length - 1} more`,
    at,
  };
}

function barHeight(ms: number): number {
  // Log scale. Most reads land in single-digit milliseconds and the occasional
  // deck read takes hundreds; on a linear scale that flattens everything
  // ordinary into a baseline smear and shows only the spikes.
  const clamped = Math.max(1, Math.min(ms, SLOW_MS));
  return Math.max(4, (Math.log(clamped) / Math.log(SLOW_MS)) * 100);
}

function ago(at: number): string {
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 1) return "just now";
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)}m ago`;
}

export default function ReaderActivity(): JSX.Element {
  // The strip itself, oldest first. Held in a ref because it advances on a
  // timer rather than in response to a render.
  const buckets = useRef<Bucket[]>(
    Array.from({ length: BARS }, (_, i) =>
      EMPTY(Date.now() - (BARS - i) * BUCKET_MS)
    )
  );
  const consumedTo = useRef<number>(Date.now());
  const [, redraw] = useState(0);
  const [latest, setLatest] = useState<Read | undefined>();

  useEffect(() => {
    // One slice per tick, whether or not anything arrived — that constant rate
    // is what makes the axis mean time. globalData is a plain object the
    // background window writes into through a channel listener, so there is
    // nothing to subscribe to and this samples it.
    const tick = setInterval(() => {
      const now = Date.now();
      const fresh = globalData.readerReads.filter(
        (r) => r.at > consumedTo.current && r.at <= now
      );
      consumedTo.current = now;

      buckets.current = [...buckets.current.slice(1), summarise(fresh, now)];
      if (fresh.length) setLatest(fresh[fresh.length - 1]);
      redraw((n) => n + 1);
    }, BUCKET_MS);
    return () => clearInterval(tick);
  }, []);

  const strip = buckets.current;
  const active = strip.filter((b) => b.count > 0);
  const reads = active.reduce((n, b) => n + b.count, 0);
  const failed = strip.filter((b) => b.kind === "failed").length;
  const slowest = strip.reduce((max, b) => Math.max(max, b.ms), 0);

  return (
    <div className="panel-card reader-activity">
      <div className="panel-card-head">
        <div className="panel-card-title">Reader activity</div>
        <div className="reader-activity-legend">
          <span className="reader-activity-key memory" /> memory
          <span className="reader-activity-key log" /> log
          {failed > 0 ? (
            <>
              <span className="reader-activity-key failed" /> failed
            </>
          ) : null}
        </div>
      </div>

      <div className="reader-activity-plot">
        {/* The scale, so a tall bar means a number rather than "taller than
            its neighbours". */}
        <div className="reader-activity-axis">
          {GRIDLINES.map((ms) => (
            <div
              className="reader-activity-gridline"
              key={ms}
              style={{ bottom: `${barHeight(ms)}%` }}
            >
              <span>{ms}ms</span>
            </div>
          ))}
        </div>

        <div className="reader-activity-chart">
          {strip.map((bucket, i) => (
            <div
              // Positional on purpose: a slot is a moment on the axis, and the
              // strip is redrawn in place rather than re-keyed each tick.
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className={`reader-activity-slot ${
                // A mark every whole second. It scrolls with the strip, so the
                // chart is visibly moving even when nothing is being read —
                // which is the difference between "idle" and "stuck", and there
                // was no way to tell them apart.
                Math.floor(bucket.at / 1000) !==
                Math.floor((bucket.at - BUCKET_MS) / 1000)
                  ? "second"
                  : ""
              }`}
              title={
                bucket.count
                  ? `${bucket.label} — ${bucket.ms}ms`
                  : "nothing read in this moment"
              }
            >
              <div
                className={`reader-activity-bar ${bucket.kind}`}
                style={
                  bucket.count
                    ? { height: `${barHeight(bucket.ms)}%` }
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Said outright. Every part of this was guessable and none of it was
          obvious: bars are equally wide because they are equally long in time,
          not because width means anything. */}
      <div className="reader-activity-caption">
        each bar is {BUCKET_MS}ms of time · height is how long the slowest read
        in it took
      </div>

      <div className="reader-activity-stats">
        <span className="reader-activity-window">last {WINDOW_LABEL}</span>
        <span>
          <b>{reads}</b> reads
        </span>
        <span>
          slowest <b>{slowest}ms</b>
        </span>
        {failed > 0 ? (
          <span className="failed">
            <b>{failed}</b> failed
          </span>
        ) : null}
        {latest ? (
          <span className="reader-activity-latest" title={latest.name}>
            {latest.name} · {latest.ms}ms · {ago(latest.at)}
          </span>
        ) : (
          <span className="reader-activity-latest">
            waiting for the log to grow…
          </span>
        )}
      </div>
    </div>
  );
}
