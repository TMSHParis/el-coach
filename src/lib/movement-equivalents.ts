// Équivalents d'un mouvement de musculation (partie 3, mission 11) : remplacement pour la séance
// seulement (machine prise, matériel absent, gêne). Table maintenue par le coach, modifiable sans
// toucher à la logique : pour chaque mouvement, une liste ordonnée de mouvements équivalents (même
// muscle principal, même schéma de mouvement). Un mouvement absent de la table n'affiche pas le
// bouton « Remplacer ». Valeurs de départ à faire valider par un coach.

import { getMovement, type Equipment } from "./movements";
import { makeT, type DictKey, type Translate } from "./i18n";

export const EQUIVALENTS_TABLE: Record<string, string[]> = {
  // Jambes
  "hack-squat": ["leg-press", "goblet-squat", "walking-lunges", "back-squat"],
  "goblet-squat": ["db-front-squat", "plate-goblet-squat", "air-squat"],
  "leg-press": ["hack-squat", "goblet-squat", "walking-lunges", "back-squat"],
  "back-squat": ["front-squat", "leg-press", "hack-squat", "goblet-squat"],
  "front-squat": ["back-squat", "goblet-squat", "db-front-squat", "leg-press"],
  "leg-extension": ["sissy-squat", "goblet-squat", "walking-lunges"],
  "walking-lunges": ["reverse-lunge", "db-bulgarian", "box-step-up", "goblet-squat"],
  "leg-curl-couche": ["leg-curl-assis", "nordic-curl", "single-leg-rdl", "glute-ham-raise-ghr"],
  "leg-curl-assis": ["leg-curl-couche", "nordic-curl", "single-leg-rdl"],
  "deadlift-roumain": ["single-leg-rdl", "trap-bar-deadlift", "cable-pull-through", "hip-thrust"],
  "hip-thrust": ["glute-bridge", "cable-pull-through", "cable-kickback"],
  "calf-raise-debout": ["calf-raise-assis", "donkey-calf-raise", "calf-raise-unilateral"],
  "calf-raise-assis": ["calf-raise-debout", "donkey-calf-raise", "calf-raise-unilateral"],
  // Dos
  "lat-pulldown": ["pulldown-prise-neutre", "pull-up", "chin-up", "australian-pull-up"],
  "pull-up": ["lat-pulldown", "chin-up", "australian-pull-up", "pulldown-prise-neutre"],
  "barbell-row": ["db-row-2", "cable-row", "machine-row", "t-bar-row", "chest-supported-row"],
  "db-row-2": ["cable-row", "machine-row", "barbell-row", "chest-supported-row", "inverted-row"],
  "cable-row": ["machine-row", "db-row-2", "chest-supported-row", "barbell-row"],
  "machine-row": ["cable-row", "chest-supported-row", "db-row-2", "barbell-row"],
  // Pectoraux
  "bench-press": ["db-bench", "db-floor-press", "incline-db-press", "push-up-variations"],
  "db-bench": ["bench-press", "db-floor-press", "incline-db-press", "push-up-variations"],
  "incline-bench-press": ["incline-db-press", "db-bench", "bench-press", "push-up-variations"],
  "pec-deck": ["cable-fly", "db-fly", "db-floor-press"],
  "cable-fly": ["pec-deck", "db-fly", "db-floor-press"],
  "db-fly": ["cable-fly", "pec-deck", "db-floor-press"],
  // Épaules
  "overhead-press-ohp": ["db-shoulder-press", "arnold-press", "landmine-press", "strict-press"],
  "db-shoulder-press": ["overhead-press-ohp", "arnold-press", "kb-press", "landmine-press"],
  "lateral-raise": ["upright-row", "front-raise", "rear-delt-fly"],
  "face-pull": ["rear-delt-fly", "lateral-raise", "upright-row"],
  // Bras
  "barbell-curl": ["db-curl", "cable-curl", "preacher-curl", "hammer-curl"],
  "db-curl": ["barbell-curl", "hammer-curl", "cable-curl", "incline-db-curl"],
  "hammer-curl": ["db-curl", "cable-curl", "incline-db-curl"],
  "tricep-pushdown": ["overhead-tricep-extension", "skull-crusher", "dips-triceps", "diamond-push-up"],
  "skull-crusher": ["overhead-tricep-extension", "tricep-pushdown", "close-grip-bench-press"],
  "dips": ["db-bench", "bench-press", "push-up-variations"],
  // Abdos
  "cable-crunch": ["crunch", "sit-up", "hanging-leg-raise"],
  "hanging-leg-raise": ["crunch", "sit-up", "cable-crunch"],
};

/** Libellé du matériel affiché sous le nom d'un équivalent (surcharges par mouvement, puis par matériel). */
const EQUIPMENT_LABEL_OVERRIDE: Record<string, DictKey> = { "plate-goblet-squat": "run.equip.plate", "air-squat": "run.equip.none" };
const EQUIPMENT_LABEL: Partial<Record<Equipment, DictKey>> = {
  none: "run.equip.none",
  machine: "run.equip.machine",
  dumbbell: "run.equip.dumbbell",
  barbell: "run.equip.barbell",
  kettlebell: "run.equip.kettlebell",
  cable: "run.equip.cable",
  bench: "run.equip.bench",
  rack: "run.equip.rack",
  box: "run.equip.box",
  ghd: "run.equip.ghd",
  pullup_bar: "run.equip.pullupBar",
  resistance_band: "run.equip.band",
  trx: "run.equip.trx",
};

export type EquivalentOption = { id: string; name: string; equipmentLabel: string; videoUrl?: string };

function equipmentLabelOf(id: string, equipment: Equipment[], t: Translate): string {
  if (EQUIPMENT_LABEL_OVERRIDE[id]) return t(EQUIPMENT_LABEL_OVERRIDE[id]);
  const first = equipment.find((e) => e !== "none") ?? "none";
  return t(EQUIPMENT_LABEL[first] ?? "run.equip.generic");
}

/**
 * Équivalents d'un mouvement, filtrés par le matériel du jour : `allowed` = matériel disponible
 * (null = tout). Même règle que la sélection des mouvements du moteur : au moins un matériel
 * disponible, ou un mouvement faisable à la maison.
 */
export function equivalentsFor(movementId: string, allowed: Equipment[] | null, t: Translate = makeT("fr")): EquivalentOption[] {
  const out: EquivalentOption[] = [];
  for (const id of EQUIVALENTS_TABLE[movementId] ?? []) {
    const m = getMovement(id);
    if (!m) continue;
    if (allowed && !(m.equipment.some((e) => allowed.includes(e)) || m.tags.includes("home-friendly"))) continue;
    out.push({ id: m.id, name: m.name, equipmentLabel: equipmentLabelOf(m.id, m.equipment, t), videoUrl: m.videoUrl });
  }
  return out.slice(0, 5);
}

/** Raisons proposées dans la feuille de remplacement (la première est présélectionnée). */
export const REPLACE_REASONS = ["Machine prise", "Pas de matériel", "Gêne ou douleur", "Autre"] as const;
/** Clés d'affichage des raisons (la valeur française reste la valeur enregistrée). */
export const REPLACE_REASON_KEYS: Record<(typeof REPLACE_REASONS)[number], DictKey> = {
  "Machine prise": "run.reason.machineTaken",
  "Pas de matériel": "run.reason.noEquipment",
  "Gêne ou douleur": "run.reason.discomfort",
  Autre: "run.reason.other",
};
