// Applique le mode compétition à la séance du jour — même logique pour le dashboard et /session.

import type { Day } from "./programming";
import { applyPrepToDay, hyroxPrepFor, scaleVolume, type HyroxPrep } from "./hyrox-prep";
import { competitionPlanFor, objectifsOf, type ProfileObjectifRow } from "./competition";
import { PHASE_NAMES_NOTE } from "./competition-notes";
import { makeT, type Translate } from "./i18n";

export function applyCompetition(
  day: Day,
  profile: ProfileObjectifRow | null | undefined,
  programSlug: string,
  todayKey: string,
  t: Translate = makeT("fr"),
): { day: Day; hyroxPrep: HyroxPrep | null } {
  if (!profile) return { day, hyroxPrep: null };
  const hyroxPrep = programSlug === "hyrox-pure" ? hyroxPrepFor(objectifsOf(profile), todayKey) : null;
  if (hyroxPrep) return { day: applyPrepToDay(day, hyroxPrep, t), hyroxPrep };

  // Autres événements : l'affûtage réduit le volume en conservant l'intensité ; rien d'autre ne change.
  const plan = competitionPlanFor(profile, todayKey);
  if (!plan || plan.volumeFactor >= 1 || plan.event === "Hyrox") return { day, hyroxPrep: null };
  const scaled = scaleVolume(day, plan.volumeFactor);
  const note = PHASE_NAMES_NOTE(plan.event, plan.current, plan.volumeFactor, t);
  return { day: { ...scaled, notes: [scaled.notes, note].filter(Boolean).join(" ") }, hyroxPrep: null };
}
