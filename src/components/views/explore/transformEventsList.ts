export default function transformEventsList(eventsList: string[]) {
  let transformedEvents = eventsList.sort();

  const rankedEvents: string[] = [
    "Ladder",
    "Alchemy_Ladder",
    "Historic_Ladder",
    "Explorer_Ladder",
    "Traditional_Ladder",
    "Traditional_Alchemy_Ladder",
    "Traditional_Historic_Ladder",
    "Traditional_Explorer_Ladder",
  ];

  const drafts: string[] = [];

  eventsList.forEach((ev) => {
    if (rankedEvents.includes(ev)) {
      transformedEvents.splice(transformedEvents.indexOf(ev), 1);
    }
    if (ev.indexOf("Draft") !== -1) {
      transformedEvents.splice(transformedEvents.indexOf(ev), 1);
      drafts.push(ev);
    }
  });

  transformedEvents = [
    "%%Ranked",
    "Ladder",
    "Alchemy_Ladder",
    "Historic_Ladder",
    "Explorer_Ladder",
    "Traditional_Ladder",
    "Traditional_Alchemy_Ladder",
    "Traditional_Historic_Ladder",
    "Traditional_Explorer_Ladder",
    "%%Drafts",
    ...drafts,
    "%%Other Events",
    ...new Set(transformedEvents),
  ];

  return transformedEvents;
}
