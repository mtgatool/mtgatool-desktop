/* eslint-disable radix */
const premierMatch = new RegExp(/(PremierDraft)_(.+)_([0-9.]+)/);
const quickMatch = new RegExp(/(QuickDraft)_(.+)_([0-9.]+)/);
const compMatch = new RegExp(/(CompDraft)_(.+)_([0-9.]+)/);
const tradMatch = new RegExp(/(TradDraft)_(.+)_([0-9.]+)/);
const sealedMatch = new RegExp(/(Sealed)_(.+)_([0-9.]+)/);
const miscDraftMatch = new RegExp(/(.+)_(Draft)_([0-9.]+)/);
// use only as last match if others fail
const tripleDateMatch = new RegExp(/(.+)_(.+)_(.+)_([0-9.]+)/);
const doubleDateMatch = new RegExp(/(.+)_(.+)_([0-9.]+)/);
const simpleDateMatch = new RegExp(/(.+)_([0-9.]+)/);
const simpleMatch = new RegExp(/(.+)_(.+)/);

const months = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// eslint-disable-next-line complexity
export default function getEventPrettyName(event: string): string {
  switch (event) {
    case "aggregated-standard":
      return "Standard";
    case "aggregated-historic":
      return "Historic";
    case "aggregated-timeless":
      return "Timeless";
    case "aggregated-alchemy":
      return "Alchemy";
    case "aggregated-explorer":
      return "Explorer";

    case "Ladder":
      return "Standard Ranked";
    case "Play":
      return "Standard";
    case "Constructed_BestOf3":
      return "Traditional Standard Event";
    case "Constructed_Event_2020":
      return "Standard Event 2020";
    case "Constructed_Event_2021":
      return "Standard Event";
    case "Constructed_Event_v2":
      return "Standard Event";
    case "Traditional_Cons_Event_2020":
      return "Traditional Standard Event 2020";
    case "Traditional_Cons_Event_2021":
      return "Traditional Standard Event";
    case "Traditional_Cons_Event_2022":
      return "Traditional Standard Event";
    case "Traditional_Ladder":
      return "Traditional Ranked Standard";

    case "Alchemy_Ladder":
      return "Alchemy Ranked";
    case "Alchemy_Play":
      return "Alchemy";
    case "Alchemy_Event":
      return "Alchemy Event";
    case "Traditional_Alchemy_Event":
      return "Traditional Alchemy Event";
    case "Traditional_Alchemy_Event_2022":
      return "Traditional Alchemy Event";
    case "Traditional_Alchemy_Play":
      return "Traditional Alchemy";
    case "Traditional_Alchemy_Ladder":
      return "Traditional Ranked Alchemy";

    case "Historic_Ladder":
      return "Historic Ranked";
    case "Historic_Play":
      return "Historic";
    case "Historic_Event_v2":
      return "Historic Event";
    case "Historic_Event":
      return "Historic Event";
    case "Traditional_Historic_Event":
      return "Traditional Historic Event";
    case "Traditional_Historic_Play":
      return "Traditional Historic";
    case "Traditional_Historic_Ladder":
      return "Traditional Ranked Historic";

    case "Timeless_Ladder":
      return "Timeless Ranked";
    case "Timeless_Play":
      return "Timeless";
    case "Timeless_Event_v2":
      return "Timeless Event";
    case "Timeless_Event":
      return "Timeless Event";
    case "Traditional_Timeless_Event":
      return "Traditional Timeless Event";
    case "Traditional_Timeless_Play":
      return "Traditional Timeless";
    case "Traditional_Timeless_Ladder":
      return "Traditional Ranked Timeless";

    case "Explorer_Ladder":
      return "Explorer Ranked";
    case "Explorer_Play":
      return "Explorer";
    case "Explorer_Event":
      return "Explorer Event";
    case "Explorer_Event_v2":
      return "Explorer Event";
    case "Traditional_Explorer_Event":
      return "Traditional Explorer Event";
    case "Traditional_Explorer_Ladder":
      return "Traditional Ranked Explorer";

    case "Future_Play2022":
      return "Future Standard";
    case "Future_Ranked2022":
      return "Ranked Future Standard";

    case "Play_Brawl":
      return "Brawl";
    case "Play_Brawl_Historic":
      return "Brawl Historic";

    default:
      break;
  }

  const premier = premierMatch.exec(event);
  if (premier) {
    return `Premier Draft ${premier[2]}`;
  }

  const quick = quickMatch.exec(event);
  if (quick) return `Quick Draft ${quick[2]}`;

  const comp = compMatch.exec(event);
  if (comp) return `Competitive Draft ${comp[2]}`;

  const trad = tradMatch.exec(event);
  if (trad) return `Traditional Draft ${trad[2]}`;

  const sealed = sealedMatch.exec(event);
  if (sealed) return `${sealed[2]} Sealed`;

  const misc = miscDraftMatch.exec(event);
  if (misc) return `${misc[1]} Draft`;

  const triple = tripleDateMatch.exec(event);
  if (triple) {
    const yy = triple[4].slice(0, 4);
    const mm = parseInt(triple[4].slice(4, 6));
    if (months[mm]) {
      return `${triple[1]} ${triple[2]} ${triple[3]} (${months[mm]} ${yy})`;
    }
    return `${triple[1]} ${triple[2]} ${triple[3]} ${triple[4]}`;
  }

  const double = doubleDateMatch.exec(event);
  if (double) {
    const yy = double[3].slice(0, 4);
    const mm = parseInt(double[3].slice(4, 6));
    if (months[mm]) {
      return `${double[1]} ${double[2]} (${months[mm]} ${yy})`;
    }
    return `${double[1]} ${double[2]} ${double[3]}`;
  }

  const simpleDate = simpleDateMatch.exec(event);
  if (simpleDate) {
    const yy = simpleDate[2].slice(0, 4);
    const mm = parseInt(simpleDate[2].slice(4, 6));
    return `${simpleDate[1]} (${months[mm]} ${yy})`;
  }

  const simple = simpleMatch.exec(event);
  if (simple) {
    return `${simple[1]} ${simple[2]}`;
  }

  return event.replace(" ", "");
}
