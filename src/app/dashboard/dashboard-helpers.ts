// Petits formatteurs pour la vue dashboard v2 — dérivés des mocks Coaching
// Adaptatif existants (coaching-adaptatif-mock.ts), pas de nouvelle logique métier.

import type { DictKey, Translate } from "@/lib/i18n";

export function minutesToHM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

export const ETAT_LABELS: Record<"green" | "yellow" | "red", { cls: "vert" | "jaune" | "rouge"; label: DictKey }> = {
  green: { cls: "vert", label: "dash.state.green" },
  yellow: { cls: "jaune", label: "dash.state.yellow" },
  red: { cls: "rouge", label: "dash.state.red" },
};

export function sleepPhaseBadge(
  minutes: number,
  kind: "lent" | "rem" | "profond" | "eveil",
  t: Translate,
): { badge: string; cls: "badgeOk" | "badgeWarn" | "badgeBad" } {
  if (kind === "profond") {
    if (minutes >= 45) return { badge: t("dash.sleep.badge.veryGood"), cls: "badgeOk" };
    if (minutes >= 40) return { badge: t("dash.sleep.badge.limit"), cls: "badgeWarn" };
    return { badge: t("dash.sleep.badge.low"), cls: "badgeBad" };
  }
  if (kind === "rem") {
    if (minutes >= 90) return { badge: t("dash.sleep.badge.excellent"), cls: "badgeOk" };
    if (minutes >= 70) return { badge: t("dash.sleep.badge.ok"), cls: "badgeWarn" };
    return { badge: t("dash.sleep.badge.low"), cls: "badgeBad" };
  }
  if (kind === "eveil") {
    if (minutes <= 90) return { badge: t("dash.sleep.badge.good"), cls: "badgeOk" };
    if (minutes <= 120) return { badge: t("dash.sleep.badge.high"), cls: "badgeWarn" };
    return { badge: t("dash.sleep.badge.tooHigh"), cls: "badgeBad" };
  }
  // lent (sommeil léger)
  if (minutes >= 240) return { badge: t("dash.sleep.badge.good"), cls: "badgeOk" };
  if (minutes >= 180) return { badge: t("dash.sleep.badge.ok"), cls: "badgeWarn" };
  return { badge: t("dash.sleep.badge.short"), cls: "badgeBad" };
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
