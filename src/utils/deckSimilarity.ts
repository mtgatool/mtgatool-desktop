import { CardObject } from "../types";
import database from "./mtga/database";

/**
 * Deck similarity, for collapsing near-duplicate lists on Explore.
 *
 * Grouping by deck hash alone fragments the picture badly: one Standard ladder
 * event held nine separate entries for the same deck, differing by two to six
 * cards, none of which had enough games on its own to mean anything. Merged,
 * they become a single 200+ game row.
 *
 * Cards are keyed by NAME, never by grpId. Arena mints a fresh grpId for every
 * printing, so the same card across two sets would otherwise read as two
 * different cards and depress the similarity of decks that are in fact
 * identical. Double-faced cards are recorded under both the front-face name and
 * the combined "A // B" name, so the front face is the key.
 *
 * Basic lands are ignored. They are a large block of cards that any two decks
 * sharing colours have in common, which inflates similarity between genuinely
 * different decks. Nonbasic lands are kept — those are archetype-defining.
 *
 * MAINDECK ONLY. Never pass a sideboard to `deckVector`: sideboards are the most
 * volatile part of a list, swapped between sessions against whatever is being
 * faced, and two identical decks with different sideboards are the same deck.
 * Including them would depress similarity for exactly the pairs that should
 * merge. `averageDecklist` does take sideboards, but that is a separate job —
 * describing a group, not deciding what belongs in it.
 */

export type DeckVector = Map<string, number>;

export function deckVector(cards: CardObject[] | undefined): DeckVector {
  const vector: DeckVector = new Map();
  (cards || []).forEach((card) => {
    const cardObj = database.card(card.id);
    if (!cardObj) return;
    if (cardObj.Rarity === "land") return; // basic land
    const key = cardObj.Name.split(" // ")[0];
    vector.set(key, (vector.get(key) || 0) + (card.quantity || 0));
  });
  return vector;
}

export function deckSize(vector: DeckVector): number {
  let total = 0;
  vector.forEach((quantity) => {
    total += quantity;
  });
  return total;
}

/**
 * Share of the larger deck that both lists have in common: the summed overlap
 * of card quantities over the bigger deck's size, so it reads directly as a
 * percentage. Two 60-card decks differing by two cards score ~97%.
 *
 * Chosen over cosine because it maps onto "how much of the deck is the same",
 * which is the question being asked. Cosine is dominated by the handful of
 * 4-ofs and rates unrelated decks far too similar; on this data it merged
 * distinct archetypes at every threshold that merged anything at all.
 */
export function deckSimilarity(a: DeckVector, b: DeckVector): number {
  let shared = 0;
  a.forEach((quantity, key) => {
    shared += Math.min(quantity, b.get(key) || 0);
  });
  const largest = Math.max(deckSize(a), deckSize(b));
  return largest ? shared / largest : 0;
}

/**
 * Picked from the gap between the two populations rather than by feel.
 *
 * Measured over every pair of lists in the same event: pairs that are the same
 * deck (ignoring Arena's "(2)" suffix) run at 84.8% median and 60.9% at the 10th
 * percentile, while pairs that are different decks top out at **46.5%** — not
 * one exceeds it. So anything from roughly 0.50 to 0.60 already separates them,
 * and 0.70 clears the different-deck ceiling by 24 points while still catching
 * the long tail of same-deck pairs.
 *
 * Cluster counts are flat from 0.75 all the way down to 0.60 (40 clusters at
 * every step), so 0.70 sits mid-plateau rather than on an edge, and no threshold
 * in that range ever merged two differently-named decks.
 *
 * This started at 0.85, which split one Standard deck in two at 84.8% — a pair
 * a person could see was the same deck. That was tuned on the widest gap the
 * data offers instead.
 */
export const DEFAULT_SIMILARITY = 0.7;

export interface AveragedCard {
  /** grpId of the printing used to display it — the one the biggest list ran */
  id: number;
  /** rounded consensus count */
  quantity: number;
  /** unrounded, for "3.4 on average" style detail */
  exact: number;
  /** how many of the group's lists ran it at all */
  inVersions: number;
}

/**
 * The consensus list for a group of near-identical decks.
 *
 * Each card's count is averaged across every list in the group, weighted by how
 * many games that list was actually played — a version with 90 games should pull
 * the average far harder than one with 5. Lists that never ran the card count as
 * zero, so a one-off tech choice does not survive into the average.
 *
 * Cards are matched by name (see the note at the top of this file), and the
 * displayed printing is taken from the most-played list that ran the card.
 *
 * The result will not always total exactly 60: it is a description of what the
 * group tends to play, not a legal decklist, and rounding each slot
 * independently does not preserve the sum. Callers showing it as a deck should
 * say so rather than implying it is submittable.
 */
export function averageDecklist(
  lists: { cards: CardObject[] | undefined; weight: number }[]
): AveragedCard[] {
  const totalWeight = lists.reduce((sum, l) => sum + Math.max(l.weight, 1), 0);
  if (!totalWeight) return [];

  const acc = new Map<
    string,
    { weighted: number; inVersions: number; id: number; bestWeight: number }
  >();

  lists.forEach((list) => {
    const weight = Math.max(list.weight, 1);
    // collapse printings within this list first, so a deck running two versions
    // of one card contributes a single combined count
    const perName = new Map<string, { qty: number; id: number }>();
    (list.cards || []).forEach((card) => {
      const cardObj = database.card(card.id);
      if (!cardObj) return;
      // basics are kept here, unlike in the similarity vector: this list is
      // meant to be read and copied into Arena, and a deck with no mana base is
      // neither
      const key = cardObj.Name.split(" // ")[0];
      const prev = perName.get(key);
      perName.set(key, {
        qty: (prev?.qty || 0) + (card.quantity || 0),
        id: prev?.id ?? card.id,
      });
    });

    perName.forEach(({ qty, id }, key) => {
      const entry = acc.get(key) || {
        weighted: 0,
        inVersions: 0,
        id,
        bestWeight: 0,
      };
      entry.weighted += qty * weight;
      entry.inVersions += 1;
      if (weight > entry.bestWeight) {
        entry.bestWeight = weight;
        entry.id = id;
      }
      acc.set(key, entry);
    });
  });

  return [...acc.values()]
    .map((entry) => ({
      id: entry.id,
      exact: entry.weighted / totalWeight,
      quantity: Math.round(entry.weighted / totalWeight),
      inVersions: entry.inVersions,
    }))
    .filter((card) => card.quantity > 0)
    .sort((a, b) => b.exact - a.exact);
}

/**
 * Single-linkage clustering: a list joins a group if it is close enough to ANY
 * member, which is the behaviour wanted for a deck evolving over time — v1 and
 * v9 may have drifted well apart while every step between them is adjacent.
 *
 * Returns groups of indices into `items`. O(n²), which is nothing at the scale
 * of one event's decks.
 */
export function clusterBySimilarity(
  vectors: DeckVector[],
  threshold: number = DEFAULT_SIMILARITY
): number[][] {
  const parent = vectors.map((_, i) => i);
  const find = (i: number): number => {
    let root = i;
    while (parent[root] !== root) root = parent[root];
    let node = i;
    while (parent[node] !== node) {
      const next = parent[node];
      parent[node] = root;
      node = next;
    }
    return root;
  };

  for (let i = 0; i < vectors.length; i += 1) {
    for (let j = i + 1; j < vectors.length; j += 1) {
      if (deckSimilarity(vectors[i], vectors[j]) >= threshold) {
        const a = find(i);
        const b = find(j);
        if (a !== b) parent[a] = b;
      }
    }
  }

  const groups = new Map<number, number[]>();
  vectors.forEach((_, i) => {
    const root = find(i);
    const group = groups.get(root);
    if (group) group.push(i);
    else groups.set(root, [i]);
  });
  return [...groups.values()];
}
