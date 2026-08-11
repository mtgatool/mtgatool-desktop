import normalizeFormats, { FormatsSnapshot } from "../normalizeFormats";

// Synthetic GetFormats payload in the 2026 shape: numeric *Internal enums,
// empty collections omitted, groups repeated, unstable ordering.
const PAYLOAD = {
  Formats: [
    {
      name: "ZzzDraft",
      legalSets: ["TST"],
      FormatTypeInternal: 1,
      mainDeckQuota: { min: 40, max: 250 },
      sideBoardQuota: {},
    },
    {
      name: "AaaStandard",
      legalSets: ["TST", "TS2"],
      filterSets: ["TST", "TS2"],
      bannedTitleIds: [123456],
      FormatTypeInternal: 3,
      CardCountRestrictionInternal: 2,
      mainDeckQuota: { min: 60, max: 250 },
      sideBoardQuota: { max: 15 },
    },
    {
      name: "MmmBrawl",
      legalSets: ["TST"],
      FormatTypeInternal: 3,
      CardCountRestrictionInternal: 1,
      SideboardBehaviorInternal: 1,
      commandZoneQuota: { min: 1, max: 1 },
      useRebalancedCards: true,
    },
  ],
  FormatGroups: [
    { GroupName: "Standard", FormatNames: ["AaaStandard"] },
    { GroupName: "Limited", FormatNames: ["ZzzDraft"] },
    { GroupName: "Standard", FormatNames: ["AaaStandard"] },
  ],
};

describe("normalizeFormats", () => {
  const snapshot = normalizeFormats(PAYLOAD) as FormatsSnapshot;

  it("sorts formats by name so the hash is stable", () => {
    expect(snapshot.Formats.map((f) => f.name)).toEqual([
      "AaaStandard",
      "MmmBrawl",
      "ZzzDraft",
    ]);
  });

  it("maps the numeric enums to their string spellings", () => {
    const [standard, brawl, draft] = snapshot.Formats;
    expect(standard.FormatType).toBe("Constructed");
    expect(standard.cardCountRestriction).toBe("UnrestrictedCardCounts");
    expect(draft.FormatType).toBe("Draft");
    expect(brawl.cardCountRestriction).toBe("Singleton");
    expect(brawl.sideboardBehavior).toBe("CompanionOnly");
    expect(brawl.useRebalancedCards).toBe(true);
  });

  it("materialises omitted collections and drops empty quotas", () => {
    const draft = snapshot.Formats[2];
    expect(draft.filterSets).toEqual([]);
    expect(draft.bannedTitleIds).toEqual([]);
    expect(draft.suspendedTitleIds).toEqual([]);
    expect(draft.individualCardQuotas).toEqual({});
    expect(draft.AllowedCommanderTitleIds).toEqual([]);
    // sideBoardQuota was `{}` — a quota that does not apply is omitted.
    expect(draft.sideBoardQuota).toBeUndefined();
    expect(draft.mainDeckQuota).toEqual({ min: 40, max: 250 });
  });

  it("dedupes and sorts format groups", () => {
    expect(snapshot.FormatGroups.map((g) => g.GroupName)).toEqual([
      "Limited",
      "Standard",
    ]);
  });

  it("keeps already-normalized string fields as they are", () => {
    const legacy = normalizeFormats({
      Formats: [{ name: "Old", FormatType: "Sealed" }],
    }) as FormatsSnapshot;
    expect(legacy.Formats[0].FormatType).toBe("Sealed");
  });

  it("rejects payloads without formats", () => {
    expect(normalizeFormats({ Formats: [] })).toBeNull();
    expect(normalizeFormats(undefined as any)).toBeNull();
  });
});
