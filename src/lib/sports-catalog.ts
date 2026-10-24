// Catalogue des activités (partie 4, mission 6) : une seule liste pour le menu « Choisir ta séance… »
// du check-in, l'ajout d'activité et la semaine type. Aucun sport existant n'est supprimé : les anciens
// libellés enregistrés en base sont rattachés à leur nouveau nom par `normalizeSport`.

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
