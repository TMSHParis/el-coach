// Petits formatteurs pour la vue dashboard v2 — dérivés des mocks Coaching
// Adaptatif existants (coaching-adaptatif-mock.ts), pas de nouvelle logique métier.

export function minutesToHM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

export const ETAT_LABELS: Record<"green" | "yellow" | "red", { cls: "vert" | "jaune" | "rouge"; label: string }> = {
  green: { cls: "vert", label: "VERT" },
  yellow: { cls: "jaune", label: "JAUNE" },
  red: { cls: "rouge", label: "ROUGE" },
};

export function sleepPhaseBadge(
  minutes: number,
  kind: "lent" | "rem" | "profond" | "eveil",
): { badge: string; cls: "badgeOk" | "badgeWarn" | "badgeBad" } {
  if (kind === "profond") {
    if (minutes >= 45) return { badge: "✅ Très bon", cls: "badgeOk" };
    if (minutes >= 40) return { badge: "⚠️ Limite", cls: "badgeWarn" };
    return { badge: "🔴 Bas", cls: "badgeBad" };
  }
  if (kind === "rem") {
    if (minutes >= 90) return { badge: "✅ Excellent", cls: "badgeOk" };
    if (minutes >= 70) return { badge: "⚠️ Correct", cls: "badgeWarn" };
    return { badge: "🔴 Bas", cls: "badgeBad" };
  }
  if (kind === "eveil") {
    if (minutes <= 90) return { badge: "✅ Bon", cls: "badgeOk" };
    if (minutes <= 120) return { badge: "⚠️ Élevé", cls: "badgeWarn" };
    return { badge: "🔴 Trop élevé", cls: "badgeBad" };
  }
  // lent (sommeil léger)
  if (minutes >= 240) return { badge: "✅ Bon", cls: "badgeOk" };
  if (minutes >= 180) return { badge: "⚠️ Correct", cls: "badgeWarn" };
  return { badge: "🔴 Court", cls: "badgeBad" };
}

export function trendColor(minutes: number, kind: "eveil" | "profond"): string {
  if (kind === "eveil") {
    if (minutes <= 90) return "var(--green)";
    if (minutes <= 120) return "var(--yellow)";
    return "var(--red)";
  }
  if (minutes >= 45) return "var(--green)";
  if (minutes >= 40) return "var(--yellow)";
  return "var(--red)";
}
