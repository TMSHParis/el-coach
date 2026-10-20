// Paramètres du coach (partie 2) — toutes les valeurs "à valider" par un coach
// vivent ici, jamais en dur dans la logique. Valeurs de départ = celles du
// document "Nouveaux programmes" (octobre 2026), construites par IA et validées
// par Mohamed, pas encore par un coach : à ajuster ici sans toucher au code.

export const COACH_PARAMS = {
  /** Séances où un finisher est remplacé quand la séance est déjà longue (objectif force/hypertrophie). */
  longSessionMinutes: 75,
  /** Durée disponible (check-in) en dessous de laquelle le finisher saute. */
  shortTimeMinutes: 45,
  /** État jaune ≈ 80 % : -1 série / -1 round, finisher supprimé. */
  yellowVolumeSetsDelta: -1,
  /** Décharge (1.12) : ~60 % du volume, mêmes mouvements, pas de finisher. */
  deloadVolumeFactor: 0.6,
  /** Bloc d'entraînement : durées proposées (semaines, décharge comprise) et valeur par défaut. */
  blockWeeksOptions: [4, 5, 6] as const,
  blockWeeksDefault: 5,
  /** Hyrox : phase Spécifique (semaines) et affûtage. */
  hyroxSpecificWeeks: 4,
  hyroxTaperWeeks: 4,
  /** Affûtage : volume restant selon les semaines avant la course (1.9). */
  hyroxTaperVolume: { w4: 0.8, w3: 0.8, w2: 0.55, w1: 0.55 } as Record<string, number>,
  /** Hybrid : volume minimum d'endurance par semaine (minutes) — à fixer par un coach. */
  hybridMinEnduranceMinutes: 60,
  /** At Home : montée dans une chaîne de progression — reps atteintes sur toutes les séries. */
  chainUpgradeReps: 12,
  chainUpgradeSets: 3,
  /** Check-in : durées proposées. */
  durationOptions: [30, 45, 60, 75] as const,
  durationOptionsAtHome: [20, 30, 45, 60] as const,
} as const;

/** Interrupteurs : fonctionnalités à ne pas ouvrir en production avant validation (6.3). */
export const FEATURE_FLAGS = {
  /** Zone à ménager : validation juridique + table de substitutions écrite par un coach. */
  zoneAMenager: false,
  /** Option "Sans impact / silencieux" (At Home) : table de remplacements à fournir par un coach. */
  sansImpact: false,
} as const;
