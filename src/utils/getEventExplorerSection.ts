/* eslint-disable radix */
const premierMatch = new RegExp(/(PremierDraft)_(.+)_([0-9.]+)/);
const quickMatch = new RegExp(/(QuickDraft)_(.+)_([0-9.]+)/);
const compMatch = new RegExp(/(CompDraft)_(.+)_([0-9.]+)/);
const tradMatch = new RegExp(/(TradDraft)_(.+)_([0-9.]+)/);
const sealedMatch = new RegExp(/(Sealed)_(.+)_([0-9.]+)/);
const miscDraftMatch = new RegExp(/(.+)_(Draft)_([0-9.]+)/);

const doubleDateMatch = new RegExp(/(.+)_(.+)_([0-9.]+)/);
const simpleDateMatch = new RegExp(/(.+)_([0-9.]+)/);
const simpleMatch = new RegExp(/(.+)_(.+)/);

// eslint-disable-next-line complexity
export default function getEventExplorerSection(
  event: string
): "Ranked" | "Play" | "Constructed" | "Other" | "Limited" | "Custom" {
  if (event.startsWith("aggregated-")) return "Custom";

  switch (event) {
    case "Ladder":
      return "Ranked";
    case "Play":
      return "Play";
    case "Constructed_BestOf3":
      return "Constructed";
    case "Constructed_Event_2020":
      return "Constructed";
    case "Constructed_Event_2021":
      return "Constructed";
    case "Constructed_Event_v2":
      return "Constructed";
    case "Traditional_Cons_Event_2020":
      return "Constructed";
    case "Traditional_Cons_Event_2021":
      return "Constructed";
    case "Traditional_Cons_Event_2022":
      return "Constructed";
    case "Traditional_Ladder":
      return "Ranked";

    case "Alchemy_Ladder":
      return "Ranked";
    case "Alchemy_Play":
      return "Play";
    case "Alchemy_Event":
      return "Constructed";
    case "Traditional_Alchemy_Event":
      return "Constructed";
    case "Traditional_Alchemy_Event_2022":
      return "Constructed";
    case "Traditional_Alchemy_Play":
      return "Play";
    case "Traditional_Alchemy_Ladder":
      return "Ranked";

    case "Historic_Ladder":
      return "Ranked";
    case "Historic_Play":
      return "Play";
    case "Historic_Event_v2":
      return "Constructed";
    case "Historic_Event":
      return "Constructed";
    case "Traditional_Historic_Event":
      return "Constructed";
    case "Traditional_Historic_Play":
      return "Play";
    case "Traditional_Historic_Ladder":
      return "Ranked";

    case "Explorer_Ladder":
      return "Ranked";
    case "Explorer_Play":
      return "Play";
    case "Explorer_Event":
      return "Constructed";
    case "Explorer_Event_v2":
      return "Constructed";
    case "Traditional_Explorer_Event":
      return "Constructed";
    case "Traditional_Explorer_Play":
      return "Play";
    case "Traditional_Explorer_Ladder":
      return "Ranked";

    case "Play_Brawl":
      return "Play";
    case "Play_Brawl_Historic":
      return "Play";

    default:
      break;
  }

  const premier = premierMatch.exec(event);
  if (premier) return "Limited";

  const quick = quickMatch.exec(event);
  if (quick) return "Limited";

  const comp = compMatch.exec(event);
  if (comp) return "Limited";

  const trad = tradMatch.exec(event);
  if (trad) return "Limited";

  const sealed = sealedMatch.exec(event);
  if (sealed) return "Limited";

  const misc = miscDraftMatch.exec(event);
  if (misc) return "Limited";

  const double = doubleDateMatch.exec(event);
  if (double) {
    if (double[1] === "Constructed") return "Constructed";
    if (double[1] === "Standard") return "Constructed";
    if (double[1] === "Alchemy") return "Constructed";
    if (double[1] === "Explorer") return "Constructed";
    if (double[1] === "CompCons") return "Constructed";
  }

  const simpledate = simpleDateMatch.exec(event);
  if (simpledate) {
    if (simpledate[1] === "Constructed") return "Constructed";
    if (simpledate[1] === "Standard") return "Constructed";
    if (simpledate[1] === "Alchemy") return "Constructed";
    if (simpledate[1] === "Explorer") return "Constructed";
    if (simpledate[1] === "CompCons") return "Constructed";
  }

  const simple = simpleMatch.exec(event);
  if (simple) {
    if (simple[1] === "Constructed") return "Constructed";
    if (simple[1] === "Standard") return "Constructed";
    if (simple[1] === "Alchemy") return "Constructed";
    if (simple[1] === "Explorer") return "Constructed";
    if (simple[1] === "CompCons") return "Constructed";
  }

  return "Other";
}
