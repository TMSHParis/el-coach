// Semaine type dérivée du programme principal (partie 2, H.16) — pure, utilisable côté client et serveur.

import type { WeekCycle, WeekCycleDay, WeekCycleDayKey } from "@/app/signup/actions";
import { SPORT_LABEL_TO_SLUG } from "./ecm-programs";
import { getTemplate } from "./programming";

const WEEK_DAY_KEYS: WeekCycleDayKey[] = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];

function emptyWeekCycle(): WeekCycle {
  const empty = (): WeekCycleDay => ({ repos: false, slots: [] });
  return { lun: empty(), mar: empty(), mer: empty(), jeu: empty(), ven: empty(), sam: empty(), dim: empty() };
}

/** Icône + libellé d'un sport ("⚡ CrossFit Pure" → "⚡"/"CrossFit Pure") —
 * les options sans emoji ("Step", "HIIT"...) retombent sur une icône neutre. */
export function splitIconLabel(raw: string): { icon: string; label: string } {
  const match = raw.match(/^(\S+)\s+(.*)$/);
  if (match && !/[a-zA-Z]/.test(match[1])) return { icon: match[1], label: match[2] };
  return { icon: "🏋️", label: raw };
}

export type StandardWeekDay = { icon: string; label: string } | null;

/**
 * Semaine type dérivée du programme principal choisi (doc H.16) — null pour
 * un jour de repos dans le template. Même source que resolveTodaySession
 * (demo-session.ts) côté check-in/dashboard, pour rester cohérent avec
 * "Prévu aujourd'hui" (doc H.15).
 */
export function standardWeekFor(programmeLabel: string): Record<WeekCycleDayKey, StandardWeekDay> | null {
  const slug = SPORT_LABEL_TO_SLUG[programmeLabel];
  const template = slug ? getTemplate(slug) : undefined;
  if (!template) return null;
  const { icon, label } = splitIconLabel(programmeLabel);
  const days = template.weeks[0]?.days ?? [];
  const out = {} as Record<WeekCycleDayKey, StandardWeekDay>;
  WEEK_DAY_KEYS.forEach((key, i) => {
    const day = days.find((d) => d.day === i + 1);
    out[key] = day && day.blocks.length > 0 ? { icon, label } : null;
  });
  return out;
}

export function standardDayToWeekCycleDay(d: StandardWeekDay): WeekCycleDay {
  if (!d) return { repos: true, slots: [] };
  return { repos: false, slots: [{ sport: `${d.icon} ${d.label}`.trim(), heure: "", duree: "", niveau: "" }] };
}

/** Semaine type dérivée du programme (jours de repos et séances du modèle) en WeekCycle complet. */
export function standardCycleFor(programmeLabel: string): WeekCycle | null {
  const standard = standardWeekFor(programmeLabel);
  if (!standard) return null;
  const out = emptyWeekCycle();
  WEEK_DAY_KEYS.forEach((k) => {
    out[k] = standardDayToWeekCycleDay(standard[k]);
  });
  return out;
}

