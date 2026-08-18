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
  isEntryWanted,
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

  it("takes the direction the capture asked for", () => {
    // The outbound request always precedes the response, so without this a
    // request/response label can only ever capture the empty envelope: the
    // real EventGetCoursesV2 capture came back as `{"request":"{}"}`.
    setActiveCaptures([
      { id: "c1", labels: ["EventGetCoursesV2"], arrows: ["<=="] },
    ]);

    expect(isEntryWanted("EventGetCoursesV2", "==>")).toBe(false);
    expect(claimCapturesFor("EventGetCoursesV2", "==>")).toEqual([]);

    expect(isEntryWanted("EventGetCoursesV2", "<==")).toBe(true);
    expect(claimCapturesFor("EventGetCoursesV2", "<==")).toEqual(["c1"]);
  });

  it("takes either direction when none was asked for", () => {
    setActiveCaptures([{ id: "c1", labels: ["Event_Join"] }]);
    expect(isEntryWanted("Event_Join", "==>")).toBe(true);
    // Entries from the other decoder branch carry no arrow at all.
    expect(isEntryWanted("Event_Join", undefined)).toBe(true);
  });

  it("does not match an arrowless entry when a direction was asked for", () => {
    setActiveCaptures([{ id: "c1", labels: ["Event_Join"], arrows: ["<=="] }]);
    expect(isEntryWanted("Event_Join", undefined)).toBe(false);
  });

  it("ignores a capture with no labels", () => {
    setActiveCaptures([{ id: "c1", labels: [] }]);
    expect(isLabelWanted("Event_Join")).toBe(false);
  });
});
