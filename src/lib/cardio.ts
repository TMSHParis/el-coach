// Saisie cardio / endurance (partie 2, 1.10) : distance et/ou temps, allure calculée
// quand les deux sont connus, zone de fréquence cardiaque.

/** "52:10" ou "1:02:10" ou "45" (minutes) → secondes ; null si illisible. */
export function parseDurationSec(text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  if (/^\d+$/.test(t)) return Number(t) * 60;
  const parts = t.split(":").map(Number);
  if (parts.some((n) => !Number.isFinite(n)) || parts.length > 3) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

export function parseKm(text: string): number | null {
  const n = parseFloat(text.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Allure en min/km ("5:07/km") quand le temps et la distance sont connus. */
export function paceText(distanceKm: string, time: string): string | null {
  const km = parseKm(distanceKm);
  const sec = parseDurationSec(time);
  if (!km || !sec) return null;
  const perKm = Math.round(sec / km);
  return `${Math.floor(perKm / 60)}:${String(perKm % 60).padStart(2, "0")}/km`;
}

export const CARDIO_ZONES = ["Z1", "Z2", "Z3", "Z4", "Z5"] as const;

/** Ligne de résultat : "10,2 km · 52:10 · 5:07/km · Z2". Null si rien n'est saisi. */
export function cardioLine(distanceKm: string, time: string, zone: string): string | null {
  const km = parseKm(distanceKm);
  const parts = [km ? `${String(km).replace(".", ",")} km` : null, time.trim() || null, paceText(distanceKm, time), zone || null].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}
