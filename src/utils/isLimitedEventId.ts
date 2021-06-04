const premierMatch = new RegExp(/(PremierDraft)_(.+)_([0-9.]+)/);
const quickMatch = new RegExp(/(QuickDraft)_(.+)_([0-9.]+)/);
const compMatch = new RegExp(/(CompDraft)_(.+)_([0-9.]+)/);
const tradMatch = new RegExp(/(TradDraft)_(.+)_([0-9.]+)/);
const sealedMatch = new RegExp(/(Sealed)_(.+)_([0-9.]+)/);

export default function isLimitedEventId(eventId: string): boolean {
  const quick = quickMatch.exec(eventId);
  if (quick) return true;

  const premier = premierMatch.exec(eventId);
  if (premier) return true;

  const comp = compMatch.exec(eventId);
  if (comp) return true;

  const trad = tradMatch.exec(eventId);
  if (trad) return true;

  const sealed = sealedMatch.exec(eventId);
  if (sealed) return true;

  return false;
}
