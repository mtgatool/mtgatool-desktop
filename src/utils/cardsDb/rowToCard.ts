/**
 * Rebuild a DbCardDataV2 from a `cards` row.
 *
 * The worker returns tuples rather than objects — cheaper to clone across the
 * boundary — so the column order here is load-bearing and must match
 * CARD_COLUMNS exactly.
 *
 * The shape is the same one the JSON database produced, so nothing downstream
 * has to know where a card came from. Fields the schema stores as JSON text
 * (the arrays and maps) are parsed back here.
 */
import { CardArt, DbCardDataV2, RankData } from "../../types";

/**
 * SELECT list for a full card, in the order rowToCard expects.
 *
 * `hasArt` is false for a database built before art resolution existed, where
 * the three art columns do not exist and selecting them is a hard error rather
 * than a null. Literals keep the column count — and therefore rowToCard's
 * indices — the same either way.
 */
export function cardColumns(hasArt: boolean): string {
  const art = hasArt
    ? "art_set, art_cn, art_substitute"
    : "NULL AS art_set, NULL AS art_cn, 0 AS art_substitute";
  return `
  grpid, titleid, name, alt_name, flavor_text, artist_credit, rarity,
  set_code, digital_set, is_token, is_primary, is_digital_only, is_rebalanced,
  rebalanced_grpid, defunct_rebalanced_grpid, collector_number, collector_max,
  uses_sideboard, mana_cost, cmc, linked_face_type, raw_frame_detail, power,
  toughness, colors, color_identity, frame_colors, types, subtypes, supertypes,
  ability_ids, hidden_ability_ids, linked_face_grpids, ability_to_token,
  ability_to_conjurations, additional_frame_details, rank_data,
  ${art},
  (SELECT group_concat(reprint_grpid) FROM card_reprints r
    WHERE r.grpid = cards.grpid) AS reprints`;
}

/** `group_concat` gives a comma-separated list, or null when there are none. */
function parseIdList(value: unknown): number[] {
  if (typeof value !== "string" || value === "") return [];
  return value
    .split(",")
    .map((id) => parseInt(id, 10))
    .filter((id) => !Number.isNaN(id));
}

function parse<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || value === "") return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed === null ? fallback : (parsed as T);
  } catch (e) {
    return fallback;
  }
}

export default function rowToCard(row: unknown[]): DbCardDataV2 {
  // Null on every card the metadata build could not place, and on every column
  // of every database built before art resolution existed.
  const art: CardArt | undefined = row[37]
    ? {
        s: row[37] as string,
        n: (row[38] as string) ?? "",
        ...(row[39] ? { sub: 1 as const } : {}),
      }
    : undefined;

  return {
    GrpId: row[0] as number,
    TitleId: row[1] as number,
    Name: (row[2] as string) ?? "",
    AltName: (row[3] as string) ?? "",
    FlavorText: (row[4] as string) ?? "",
    ArtistCredit: (row[5] as string) ?? "",
    Rarity: row[6] as DbCardDataV2["Rarity"],
    Set: (row[7] as string) ?? "",
    DigitalSet: (row[8] as string) ?? "",
    IsToken: !!row[9],
    IsPrimaryCard: !!row[10],
    IsDigitalOnly: !!row[11],
    IsRebalanced: !!row[12],
    RebalancedCardGrpId: (row[13] as number) ?? 0,
    DefunctRebalancedCardGrpId: (row[14] as number) ?? 0,
    CollectorNumber: (row[15] as string) ?? "",
    CollectorMax: (row[16] as string) ?? "",
    UsesSideboard: (row[17] as number) ?? 0,
    ManaCost: parse<string[]>(row[18], []),
    Cmc: (row[19] as number) ?? 0,
    LinkedFaceType: (row[20] as number) ?? 0,
    RawFrameDetail: (row[21] as string) ?? "",
    Power: (row[22] as string) ?? "",
    Toughness: (row[23] as string) ?? "",
    Colors: parse<number[]>(row[24], []),
    ColorIdentity: parse<number[]>(row[25], []),
    FrameColors: parse<number[]>(row[26], []),
    Types: (row[27] as string) ?? "",
    Subtypes: (row[28] as string) ?? "",
    Supertypes: (row[29] as string) ?? "",
    AbilityIds: parse<number[]>(row[30], []),
    HiddenAbilityIds: parse<number[]>(row[31], []),
    LinkedFaceGrpIds: parse<number[]>(row[32], []),
    AbilityIdToLinkedTokenGrpId: parse<Record<string, string>>(row[33], {}),
    AbilityIdToLinkedConjurations: parse<Record<string, string>>(row[34], {}),
    AdditionalFrameDetails: parse<string[]>(row[35], []),
    RankData: parse<RankData>(row[36], { rankSource: -1 } as RankData),
    // The other printings of this same card.
    //
    // Arena counts copies across every printing, so this is what tells the
    // wildcard maths that a deck's printing is covered by a playset held on a
    // different one. It was dropped when the database moved to SQLite, on the
    // belief that nothing read it — but getWildcardsMissing does, and reported
    // cards as missing that were sitting in the collection under another set.
    //
    // A joined column rather than a second query, so `database.card()` stays
    // synchronous: it is an indexed lookup averaging under two rows per card
    // (the worst in the set is Evolving Wilds at 19).
    Reprints: parseIdList(row[40]),
    Art: art,
  };
}
