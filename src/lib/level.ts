// Niveau (partie 2, 1.8 / 2.8) : le niveau choisi par créneau dans la semaine type fait foi
// pour la séance de ce créneau ; profile.niveau sert de valeur par défaut.

import type { Block, Day } from "./programming";
import { LEVEL_SETS_DELTA } from "./coach-params";
import { SLUG_TO_SPORT_LABEL } from "./ecm-programs";
import { blockRoles } from "./session-modular";

export type LevelKey = keyof typeof LEVEL_SETS_DELTA;

/** "🌱 Débutant", "Intermédiaire", "expert"… → clé normalisée. */
export function normalizeLevel(label: string | null | undefined): LevelKey | null {
  const t = (label ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  if (t.includes("debut") || t.includes("beginner")) return "debutant";
  if (t.includes("inter")) return "intermediaire";
  if (t.includes("avance") || t.includes("expert")) return "avance";
  if (t.includes("elite")) return "elite";
  return null;
}

const DAY_KEYS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];

type CycleLike = Record<string, { repos?: boolean; slots?: { sport: string; niveau?: string }[] }> | null | undefined;

/** Niveau du créneau d'aujourd'hui pour ce programme, sinon le niveau du profil, sinon Intermédiaire. */
export function levelForToday(weekCycle: CycleLike, slug: string, profileNiveau: string | null | undefined, dayNumber: number): LevelKey {
  const label = SLUG_TO_SPORT_LABEL[slug];
  const slot = weekCycle?.[DAY_KEYS[dayNumber - 1]]?.slots?.find((s) => s.sport === label && s.niveau);
  return normalizeLevel(slot?.niveau) ?? normalizeLevel(profileNiveau) ?? "intermediaire";
}

/** Variante par niveau : séries en plus ou en moins sur les blocs de travail (B2 à B4). */
export function applyLevel(day: Day, level: LevelKey): Day {
  const delta = LEVEL_SETS_DELTA[level];
  if (!delta) return day;
  const roles = blockRoles(day.blocks);
  const blocks: Block[] = day.blocks.map((b, i) =>
    roles[i] === "B2" || roles[i] === "B3" || roles[i] === "B4"
      ? { ...b, exercises: b.exercises.map((e) => (typeof e.sets === "number" ? { ...e, sets: Math.max(1, e.sets + delta) } : e)) }
      : b,
  );
  return { ...day, blocks };
}
