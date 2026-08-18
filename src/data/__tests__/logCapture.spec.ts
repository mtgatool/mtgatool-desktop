/**
 * The parser-side rules of log capture.
 *
 * The server enforces the real limits, but a client that kept matching a label
 * would keep sending for the whole session and rely on the server to say no
 * every time. These are the rules that make it quiet instead.
 *
 * No mocks: this half imports nothing, which is the point of it being separate
 * from logCaptureSync.
 */
import {
  claimCapturesFor,
  isLabelWanted,
  setActiveCaptures,
} from "../logCapture";

afterEach(() => setActiveCaptures([]));

describe("log capture matching", () => {
  it("wants nothing until a capture says so", () => {
    expect(isLabelWanted("GreToClientEvent")).toBe(false);
  });

  it("matches only the labels a capture asked for", () => {
    setActiveCaptures([{ id: "c1", labels: ["Event_Join"] }]);
    expect(isLabelWanted("Event_Join")).toBe(true);
    expect(isLabelWanted("GreToClientEvent")).toBe(false);
  });

  it("claims a capture once and then goes quiet", () => {
    setActiveCaptures([{ id: "c1", labels: ["Event_Join"] }]);

    expect(claimCapturesFor("Event_Join")).toEqual(["c1"]);
    // Second sighting of the same label sends nothing: one entry per capture
    // per session, decided here rather than by asking the server again.
    expect(claimCapturesFor("Event_Join")).toEqual([]);
    expect(isLabelWanted("Event_Join")).toBe(false);
  });

  it("claims every capture watching a label at once", () => {
    setActiveCaptures([
      { id: "c1", labels: ["Event_Join"] },
      { id: "c2", labels: ["Event_Join", "Event_DeckSubmit"] },
    ]);

    expect(claimCapturesFor("Event_Join").sort()).toEqual(["c1", "c2"]);
    // c2 wanted two labels but has had its one entry, so the other stops too.
    expect(isLabelWanted("Event_DeckSubmit")).toBe(false);
  });

  it("leaves other captures alone", () => {
    setActiveCaptures([
      { id: "c1", labels: ["Event_Join"] },
      { id: "c2", labels: ["Event_DeckSubmit"] },
    ]);

    claimCapturesFor("Event_Join");

    expect(isLabelWanted("Event_DeckSubmit")).toBe(true);
    expect(claimCapturesFor("Event_DeckSubmit")).toEqual(["c2"]);
  });

  it("ignores a capture with no labels", () => {
    setActiveCaptures([{ id: "c1", labels: [] }]);
    expect(isLabelWanted("Event_Join")).toBe(false);
  });
});
