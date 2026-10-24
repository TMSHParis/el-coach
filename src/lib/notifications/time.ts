// Heures et jours dans le fuseau de l'appareil de l'utilisateur (partie 5, mission 4A.4). Pur.

export type LocalParts = { dateKey: string; minutes: number; weekday: number };

/** Date « YYYY-MM-DD », minutes depuis minuit et jour de semaine (0 = dimanche) de `now` dans `tz`. */
export function localParts(now: Date, tz: string): LocalParts {
  let zone = tz;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
  } catch {
    zone = "UTC";
  }
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  });
  const get = (type: string) => f.formatToParts(now).find((p) => p.type === type)?.value ?? "";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
    weekday: days.indexOf(get("weekday")),
  };
}

/** « 07:30 », « 7h », « 18h30 », « 18:30 » -> minutes depuis minuit ; null si illisible. */
export function parseClock(raw: string | null | undefined): number | null {
  const m = (raw ?? "").match(/(\d{1,2})\s*[h:]\s*(\d{2})?/i);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Plage silencieuse : 22h00 à 6h00 (paramètres). */
export const QUIET_START = 22 * 60;
export const QUIET_END = 6 * 60;
export const isQuiet = (minutes: number) => minutes >= QUIET_START || minutes < QUIET_END;

export function addDays(dateKey: string, n: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

export function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}
