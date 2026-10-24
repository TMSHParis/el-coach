// Catalogue des activités (partie 4, mission 6) : une seule liste pour le menu « Choisir ta séance… »
// du check-in, l'ajout d'activité et la semaine type. Aucun sport existant n'est supprimé : les anciens
// libellés enregistrés en base sont rattachés à leur nouveau nom par `normalizeSport`.

import { makeT, type DictKey, type Lang } from "@/lib/i18n";

export type SportGroup = { label: string; options: string[] };

/** Groupes de sports hors ECM, dans l'ordre du menu (les groupes Repos et Programmations ECM sont ajoutés par l'écran). */
export const SPORT_GROUPS: SportGroup[] = [
  {
    label: "🥊 SPORTS DE COMBAT",
    options: [
      "🥊 Boxe Thaï / Muay Thai",
      "🥋 MMA / Arts martiaux mixtes",
      "🥊 Boxe anglaise",
      "🥋 Jiu-Jitsu brésilien",
      "🥋 Judo / Lutte",
      "🥋 Karaté / Taekwondo",
    ],
  },
  {
    label: "🏃 CARDIO & ENDURANCE",
    options: [
      "🏃 Running / Jogging",
      "🚴 Cyclisme / Vélo",
      "🏊 Natation",
      "🚣 Aviron / Rowing",
      "⛷️ Trail / Ski de fond",
      // Cours collectifs déjà présents dans l'application : conservés ici.
      "Step",
      "CrossTraining",
      "CAF — Cuisse Abdo Fessier",
      "HIIT",
      "Cardio Boxe",
    ],
  },
  {
    label: "⚽ SPORTS COLLECTIFS",
    options: ["⚽ Football", "🏀 Basketball", "🏈 Rugby", "🏐 Volleyball", "🎾 Tennis / Padel", "🏒 Hockey"],
  },
  {
    label: "🧘 MOBILITÉ & BIEN-ÊTRE",
    options: ["🧘 Yoga / Pilates", "🤸 Calisthénie", "🏄 Surf / Paddle", "🧗 Escalade"],
  },
];

/** Anciens libellés (enregistrés avant la partie 4) -> libellé actuel. */
const LEGACY_SPORT_ALIASES: Record<string, string> = {
  "🥋 MMA": "🥋 MMA / Arts martiaux mixtes",
  "🏃 Running": "🏃 Running / Jogging",
  "🚴 Cyclisme": "🚴 Cyclisme / Vélo",
  "⛷️ Trail": "⛷️ Trail / Ski de fond",
};

export function normalizeSport(value: string): string {
  return LEGACY_SPORT_ALIASES[value] ?? value;
}

/** Tous les sports hors ECM (sans repos). */
export const ALL_SPORTS: string[] = SPORT_GROUPS.flatMap((g) => g.options);

/** Libellé (français, tel qu'enregistré) -> clé du dictionnaire. Les noms internationaux (Football, Tennis, HIIT, Step...) n'y figurent pas. */
const SPORT_LABEL_KEYS: Record<string, DictKey> = {
  "🛋️ REPOS": "ci.sport.groupRest",
  "⚡ PROGRAMMATIONS ECM": "ci.sport.groupEcm",
  "⚡ MES PROGRAMMES": "ci.sport.groupMine",
  "🥊 SPORTS DE COMBAT": "ci.sport.groupCombat",
  "🏃 CARDIO & ENDURANCE": "ci.sport.groupCardio",
  "⚽ SPORTS COLLECTIFS": "ci.sport.groupTeam",
  "🧘 MOBILITÉ & BIEN-ÊTRE": "ci.sport.groupWell",
  "🥊 Boxe Thaï / Muay Thai": "ci.sport.muayThai",
  "🥋 MMA / Arts martiaux mixtes": "ci.sport.mma",
  "🥊 Boxe anglaise": "ci.sport.boxing",
  "🥋 Jiu-Jitsu brésilien": "ci.sport.bjj",
  "🥋 Judo / Lutte": "ci.sport.judo",
  "🥋 Karaté / Taekwondo": "ci.sport.karate",
  "🏃 Running / Jogging": "ci.sport.running",
  "🚴 Cyclisme / Vélo": "ci.sport.cycling",
  "🏊 Natation": "ci.sport.swimming",
  "🚣 Aviron / Rowing": "ci.sport.rowing",
  "⛷️ Trail / Ski de fond": "ci.sport.trail",
  "CAF — Cuisse Abdo Fessier": "ci.sport.caf",
  "Cardio Boxe": "ci.sport.cardioBoxing",
  "🏀 Basketball": "ci.sport.basketball",
  "🏐 Volleyball": "ci.sport.volleyball",
  "🎾 Tennis / Padel": "ci.sport.tennis",
  "🤸 Calisthénie": "ci.sport.calisthenics",
  "🧗 Escalade": "ci.sport.climbing",
  // Repos et récupération active (valeurs de seance-kinds.ts)
  Repos: "ci.sport.rest",
  "Récupération active": "ci.sport.recup",
  "😴 Repos total": "ci.sport.restFull",
  "🧘 Repos + étirements doux": "ci.sport.restStretch",
  "💤 Repos + sommeil prioritaire": "ci.sport.restSleep",
  "🚶 Marche": "ci.sport.walk",
  "🏊 Natation détente": "ci.sport.swimEasy",
  "🚴 Vélo tranquille": "ci.sport.bikeEasy",
  "🧘 Yoga / mobilité": "ci.sport.yogaMobility",
  "🤸 Étirements guidés": "ci.sport.stretchGuided",
};

const stripEmoji = (s: string) => s.replace(/^[^\p{L}\p{N}]+/u, "").trim();

/** Même table indexée par libellé sans emoji (ex. "Boxe anglaise"), pour les libellés déjà dépouillés de leur icône. */
const SPORT_LABEL_KEYS_NO_EMOJI: Record<string, DictKey> = Object.fromEntries(
  Object.entries(SPORT_LABEL_KEYS).map(([label, key]) => [stripEmoji(label), key]),
);

/**
 * AFFICHAGE d'un sport (ou d'un intitulé de groupe, d'un sous-type de repos) dans la langue active.
 * La valeur enregistrée / comparée reste le libellé français : n'utiliser cette fonction que pour afficher.
 * Les noms internationaux (Football, Tennis, HIIT, Step...) et les programmes ECM sont renvoyés tels quels,
 * comme toute valeur inconnue. Avec ou sans emoji en tête ("🥊 Boxe anglaise" ou "Boxe anglaise").
 */
export function sportLabel(value: string, lang: Lang): string {
  if (lang === "fr" || !value) return value;
  const t = makeT(lang);
  const v = normalizeSport(value);
  const exact = SPORT_LABEL_KEYS[v];
  if (exact) return t(exact);
  const loose = SPORT_LABEL_KEYS_NO_EMOJI[v];
  if (loose) return stripEmoji(t(loose));
  return value;
}
