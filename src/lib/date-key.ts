/** Clé jour locale "YYYY-MM-DD" pour une date donnée — format utilisé comme date de checkin/dashboardOutput. */
export function dateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Clé du jour courant — voir `dateKey`. */
export function todayKey(): string {
  return dateKey(new Date());
}
