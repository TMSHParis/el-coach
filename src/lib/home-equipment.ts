// Niveaux de matériel At Home (partie 2, 2.7) : Aucun / Basique / Étendu, reliés aux lieux de
// profile.equipement par la table EQUIPEMENT_TO_HOME_LEVEL (coach-params.ts).

import { EQUIPEMENT_TO_HOME_LEVEL, type HomeLevel } from "./coach-params";

function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function homeLevelFrom(label: string | null | undefined): HomeLevel | null {
  const t = norm(label ?? "");
  if (!t) return null;
  return EQUIPEMENT_TO_HOME_LEVEL.find((m) => t.includes(m.match))?.level ?? null;
}

/** Niveau de matériel du jour : le choix du check-in prime sur l'équipement du profil. */
export function homeLevelForToday(checkinEquipment: string | null | undefined, profileEquipement: string | null | undefined): HomeLevel {
  return homeLevelFrom(checkinEquipment) ?? homeLevelFrom(profileEquipement) ?? "basique";
}
