// « Prévu aujourd'hui » du check-in (partie 3, mission 9) : vient UNIQUEMENT de la semaine
// enregistrée dans le profil, lue pour la date du jour (modification ponctuelle > alternance A/B
// > semaine type). Aucun autre calcul (ordre des programmes, dernier programme utilisé).

import type { WeekCycle, WeekCycleDayKey } from "@/app/signup/actions";
import { SPORT_LABEL_TO_SLUG } from "./ecm-programs";
import { splitIconLabel } from "./standard-week";
import { normalizeSport } from "./sports-catalog";
import { isEmptyCycle } from "./week-cycle";

export type PlanCard = {
  /** Valeur envoyée comme « séance du jour » (libellé complet avec icône). */
  value: string;
  icon: string;
  name: string;
  /** ECM : nom de la séance suivante de la suite ; hors ECM : « Séance hors ECM ». */
  sub: string;
  /** Heure (« 18h30 ») et durée (« 1h30 »), si renseignées. */
  heure: string;
  duree: string;
  ecm: boolean;
};

export type CheckinPlan = { kind: "none" } | { kind: "rest" } | { kind: "day"; cards: PlanCard[] };

/** Minutes depuis minuit d'une heure « 18h30 », « 7h », « 18:30 » ; très grand si illisible (classé en dernier). */
function heureMinutes(h: string): number {
  const m = h.match(/(\d{1,2})\s*[h:]\s*(\d{2})?/i);
  return m ? Number(m[1]) * 60 + Number(m[2] ?? 0) : 24 * 60;
}

export function buildCheckinPlan(
  weekCycle: WeekCycle | null | undefined,
  dayKey: WeekCycleDayKey,
  /** Séance suivante de la suite de chaque programme ECM (clé : libellé du programme). */
  nextByProgram: Record<string, string>,
): CheckinPlan {
  if (!weekCycle || isEmptyCycle(weekCycle)) return { kind: "none" };
  const day = weekCycle[dayKey];
  const slots = (day?.slots ?? []).filter((s) => s.sport);
  if (!day || day.repos || slots.length === 0) return { kind: "rest" };
  const cards = slots
    .map((s, i) => ({ s, i }))
    .sort((a, b) => heureMinutes(a.s.heure) - heureMinutes(b.s.heure) || a.i - b.i)
    .map(({ s }): PlanCard => {
      const sport = normalizeSport(s.sport);
      const { icon, label } = splitIconLabel(sport);
      const ecm = sport in SPORT_LABEL_TO_SLUG;
      return {
        value: sport,
        icon,
        name: label,
        sub: ecm ? nextByProgram[sport] ?? "" : "Séance hors ECM",
        heure: s.heure ?? "",
        duree: s.duree ?? "",
        ecm,
      };
    });
  return { kind: "day", cards };
}
