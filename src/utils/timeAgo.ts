/* eslint-disable guard-for-in */
const locales = {
  prefix: "",
  separator: " ",
  sufix: "ago",
  seconds: "Less than a minute",
  minute: "About a minute",
  minutes: "%d minutes",
  hour: "About an hour",
  hours: "About %d hours",
  day: "A day",
  days: "%d days",
  month: "About a month",
  months: "%d months",
  year: "About a year",
  years: "%d years",
} as any;

/**
 * Converts a number/epoch timestamp to a relative past time string.
 *
 * Credit: https://stackoverflow.com/questions/6108819/javascript-timestamp-to-relative-time
 * @param timestamp number
 * @returns string
 */
export default function timeAgo(timestamp: number): string {
  const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
  const { separator } = locales;
  let words = locales.prefix + separator;
  let interval = 0;

  const intervals = {
    year: seconds / 31536000,
    month: seconds / 2592000,
    day: seconds / 86400,
    hour: seconds / 3600,
    minute: seconds / 60,
  } as any;

  let distance = locales.seconds;

  // eslint-disable-next-line no-restricted-syntax
  for (const key in intervals) {
    interval = Math.floor(intervals[key]);

    if (interval > 1) {
      distance = locales[`${key}s`];
      break;
    } else if (interval === 1) {
      distance = locales[key];
      break;
    }
  }

  distance = distance.replace(/%d/i, interval);
  words += distance + separator + locales.sufix;

  return words.trim();
}
