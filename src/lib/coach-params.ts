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

/**
 * Niveau (1.8) : les programmes sont écrits pour Intermédiaire. Les chiffres précis par
 * niveau ne sont pas définis (à fournir par un coach) ; valeurs de départ : le Débutant a
 * une série de moins par mouvement, l'Avancé et l'Élite gardent le volume du modèle.
 */
export const LEVEL_SETS_DELTA: Record<"debutant" | "intermediaire" | "avance" | "elite", number> = {
  debutant: -1,
  intermediaire: 0,
  avance: 0,
  elite: 0,
};

/** Focus du jour proposés au check-in (1.3 c) : s'ajoutent au B4, ne remplacent pas le cœur de séance. */
export const FOCUS_MUSCLE_OPTIONS = ["Bras", "Épaules", "Abdos", "Dos", "Pectoraux", "Fessiers", "Mollets"] as const;
export const FOCUS_AT_HOME_OPTIONS = ["Haut du corps", "Jambes", "Core", "Skill"] as const;

/** Matériel du jour proposé au check-in (1.3 d). */
export const EQUIPMENT_OPTIONS_ECM = ["Salle complète", "Haltères seulement", "Poids du corps"] as const;
export const EQUIPMENT_OPTIONS_AT_HOME = ["Étendu", "Basique", "Aucun"] as const;

/**
 * Correspondance profil.equipement (lieux) → niveau de matériel At Home
 * (Aucun / Basique / Étendu). Table paramétrable : clé = libellé normalisé
 * (sans accent, minuscules) contenu dans la valeur du profil.
 */
export type HomeLevel = "aucun" | "basique" | "etendu";
export const EQUIPEMENT_TO_HOME_LEVEL: { match: string; level: HomeLevel }[] = [
  { match: "salle complete", level: "etendu" },
  { match: "salle limitee", level: "etendu" },
  { match: "les deux", level: "etendu" },
  { match: "etendu", level: "etendu" },
  { match: "maison", level: "basique" },
  { match: "halteres", level: "basique" },
  { match: "basique", level: "basique" },
  { match: "exterieur", level: "aucun" },
  { match: "poids du corps", level: "aucun" },
  { match: "aucun", level: "aucun" },
];

/** Format de séance (1.3 b) proposé d'après la durée disponible. */
export type SessionFormat = "complet" | "deux_blocs" | "un_bloc";
export const FORMAT_BY_MINUTES: { maxMinutes: number; format: SessionFormat }[] = [
  { maxMinutes: 30, format: "un_bloc" },
  { maxMinutes: 45, format: "deux_blocs" },
  { maxMinutes: 9999, format: "complet" },
];

/** Interrupteurs : fonctionnalités à ne pas ouvrir en production avant validation (6.3). */
export const FEATURE_FLAGS = {
  /** Zone à ménager : validation juridique + table de substitutions écrite par un coach. */
  zoneAMenager: false,
  /** Option "Sans impact / silencieux" (At Home) : table de remplacements à fournir par un coach. */
  sansImpact: false,
} as const;
