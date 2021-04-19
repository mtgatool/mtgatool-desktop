function getTwoDigitString(val: number): string {
  return (val < 10 ? "0" : "") + val;
}

export function toMMSS(secNum: number): string {
  const hours = Math.floor(secNum / 3600);
  const minutes = Math.floor((secNum - hours * 3600) / 60);
  const seconds = secNum - hours * 3600 - minutes * 60;
  const minutesStr = getTwoDigitString(minutes);
  const secondsStr = getTwoDigitString(seconds);
  if (hours > 0) {
    return `${hours}:${minutesStr}:${secondsStr}`;
  }
  return `${minutes}:${secondsStr}`;
}

export function toDDHHMMSS(secNum: number): string {
  const dd = Math.floor(secNum / 86400);
  const hh = Math.floor((secNum - dd * 86400) / 3600);
  const mm = Math.floor((secNum - dd * 86400 - hh * 3600) / 60);
  const ss = secNum - dd * 86400 - hh * 3600 - mm * 60;

  const days = dd + (dd > 1 ? " days" : " day");
  const hours = hh + (hh > 1 ? " hours" : " hour");
  const minutes = mm + (mm > 1 ? " minutes" : " minute");
  const seconds = ss + (ss > 1 ? " seconds" : " second");

  return `${dd > 0 ? `${days}, ` : ""}
${hh > 0 ? `${hours}, ` : ""}
${minutes}, 
${seconds}`;
}

export function toHHMMSS(secNum: number): string {
  const hours = Math.floor(secNum / 3600);
  const minutes = Math.floor((secNum - hours * 3600) / 60);
  const seconds = secNum - hours * 3600 - minutes * 60;
  const hoursStr = getTwoDigitString(hours);
  const minutesStr = getTwoDigitString(minutes);
  const secondsStr = getTwoDigitString(seconds);
  return `${hoursStr}:${minutesStr}:${secondsStr}`;
}

export function toHHMM(secNum: number): string {
  const hours = Math.floor(secNum / 3600);
  const minutes = Math.floor((secNum - hours * 3600) / 60);
  const hoursStr = getTwoDigitString(hours);
  const minutesStr = getTwoDigitString(minutes);
  return `${hoursStr}:${minutesStr}`;
}
