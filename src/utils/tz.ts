export const dayKey = (d: Date | string, tz: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: tz }).format(new Date(d));

export const fmtTime = (d: Date | string, tz: string) =>
  new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz }).format(new Date(d));

export function addDays(key: string, n: number): string {
  const d = new Date(key + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function addMonths(key: string, n: number): string {
  const d = new Date(key + "T00:00:00Z");
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}

export const weekday = (key: string) => new Date(key + "T00:00:00Z").getUTCDay();

export const label = (key: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fr-FR", { ...opts, timeZone: "UTC" }).format(new Date(key + "T00:00:00Z"));

// Convertit "jour + heure" exprimés dans le fuseau tz en date UTC.
export function zonedToUtc(day: string, time: string, tz: string): Date {
  const guess = new Date(`${day}T${time}:00Z`);
  const s = new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).format(guess);
  const shown = new Date(s.replace(" ", "T") + "Z");
  return new Date(guess.getTime() - (shown.getTime() - guess.getTime()));
}
