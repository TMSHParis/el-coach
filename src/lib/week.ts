// Semaines (lundi → dimanche) en clés YYYY-MM-DD, sans fuseau : tout se calcule en date locale.

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toKey(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

/** Lundi de la semaine qui contient `dateKey`. */
export function mondayOf(dateKey: string): string {
  const d = parseKey(dateKey);
  const js = d.getDay(); // 0 = dimanche
  d.setDate(d.getDate() - (js === 0 ? 6 : js - 1));
  return toKey(d);
}

export function addWeeks(weekStart: string, n: number): string {
  const d = parseKey(weekStart);
  d.setDate(d.getDate() + 7 * n);
  return toKey(d);
}

/** "Cette semaine", "Semaine prochaine", sinon la plage ("19 - 25 octobre"). */
export function weekTitle(weekStart: string, todayKey: string): string {
  const current = mondayOf(todayKey);
  if (weekStart === current) return "Cette semaine";
  if (weekStart === addWeeks(current, 1)) return "Semaine prochaine";
  if (weekStart === addWeeks(current, -1)) return "Semaine dernière";
  const start = parseKey(weekStart);
  const end = parseKey(addWeeks(weekStart, 0));
  end.setDate(end.getDate() + 6);
  const month = (d: Date) => d.toLocaleDateString("fr-FR", { month: "long" });
  return start.getMonth() === end.getMonth()
    ? `${start.getDate()} - ${end.getDate()} ${month(end)}`
    : `${start.getDate()} ${month(start)} - ${end.getDate()} ${month(end)}`;
}
