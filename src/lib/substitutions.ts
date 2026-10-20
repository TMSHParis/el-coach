// Zone à ménager et option « Sans impact / silencieux » (partie 2, 1.3 e/f, 6.3).
// LIVRÉS DERRIÈRE FEATURE_FLAGS, DÉSACTIVÉS : les tables de remplacement doivent être écrites
// par un coach (movementId → movementId) et la zone à ménager validée juridiquement avant
// toute mise en production. Tant que les tables sont vides, aucune séance n'est modifiée.
//
// La zone à ménager ne vaut que pour la séance du jour : elle n'est PAS enregistrée dans le
// profil ni dans l'historique (cookie de session qui expire à la fin de la journée).

import type { Day } from "./programming";
import { FEATURE_FLAGS } from "./coach-params";

export const ZONES = ["Épaule", "Genou", "Dos", "Poignet", "Autre"] as const;
export type Zone = (typeof ZONES)[number];

export const MEDICAL_DISCLAIMER = "Ce n'est pas un avis médical";
export const ZONE_WARNING =
  "Cette demande touche à la santé : elle ne vaut que pour la séance du jour, n'est pas enregistrée dans le profil, et l'app affiche « Ce n'est pas un avis médical ».";

/** À fournir par un coach : { zone: { movementId: movementIdDeRemplacement } }. */
export const ZONE_SUBSTITUTIONS: Record<string, Record<string, string>> = {};
/** À fournir par un coach : sauts et impacts → variantes sans impact. */
export const NO_IMPACT_SUBSTITUTIONS: Record<string, string> = {};

export const ZONE_COOKIE = "ecm_zone_du_jour";
export const NO_IMPACT_COOKIE = "ecm_sans_impact";

function swap(day: Day, map: Record<string, string>, reason: string): Day {
  if (Object.keys(map).length === 0) return day;
  return {
    ...day,
    blocks: day.blocks.map((b) => ({
      ...b,
      exercises: b.exercises.map((e) =>
        map[e.movementId] ? { ...e, movementId: map[e.movementId], notes: [e.notes, reason].filter(Boolean).join(" ") } : e,
      ),
    })),
  };
}

/** Applique les remplacements du jour. Sans effet tant que les interrupteurs sont désactivés. */
export function applyDaySubstitutions(day: Day, opts: { zone?: string | null; noImpact?: boolean }): Day {
  let out = day;
  if (FEATURE_FLAGS.zoneAMenager && opts.zone && ZONE_SUBSTITUTIONS[opts.zone]) {
    out = swap(out, ZONE_SUBSTITUTIONS[opts.zone], `(${opts.zone.toLowerCase()} ménagé · ${MEDICAL_DISCLAIMER})`);
  }
  if (FEATURE_FLAGS.sansImpact && opts.noImpact) {
    out = swap(out, NO_IMPACT_SUBSTITUTIONS, "(sans impact)");
  }
  return out;
}
