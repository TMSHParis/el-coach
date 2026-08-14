// Contenu marketing des pages détaillées /training/[slug] — un niveau au-dessus
// de la programmation exercice par exercice (programming.ts) : structure générique
// d'une séance, répartition hebdo, réaction du Coaching Adaptatif selon l'état du
// jour, et CTA vers l'inscription. Source : brief EL COACH METHOD, mai 2026.

export type SessionBlock = {
  label: string;
  tags?: string[]; // ex: ["Not For Time"], ["AMRAP", "For Time", "EMOM"]
  duration?: string; // ex: "15 min", "20-25 min"
  description: string;
};

export type SessionGroup = {
  title?: string; // ex: "JOUR CROSSFIT" pour Hybrid Engine — absent = groupe unique
  blocks: SessionBlock[];
};

export type WeeklySplitItem = {
  day: string;
  focus: string;
};

export type AdaptiveState = {
  level: "VERT" | "JAUNE" | "ROUGE";
  description: string;
};

export type ProgramDetailContent = {
  slug: string;
  name: string;
  tagline?: string;
  shortDescription: string;
  sessionGroups: SessionGroup[];
  weeklySplit?: WeeklySplitItem[];
  extraNote?: { title: string; lines: string[] };
  adaptiveStates: AdaptiveState[];
  ctaLabel: string;
};

export const programDetailContent: Record<string, ProgramDetailContent> = {
  "crossfit-pure": {
    slug: "crossfit-pure",
    name: "CrossFit Pure",
    shortDescription: "Une programmation conjuguée. Rien n'est laissé au hasard.",
    sessionGroups: [
      {
        blocks: [
          {
            label: "Bloc 1 — Warm Up",
            tags: ["Not For Time"],
            description: "Mobilité, activation cardio, mouvements spécifiques à la séance.",
          },
          {
            label: "Bloc 2 — Skill / Strength",
            tags: ["Build to Heavy"],
            description: "Mouvement technique ou levé lourd. Snatch, muscle-up, squat lourd...",
          },
          {
            label: "Bloc 3 — WOD",
            tags: ["AMRAP", "For Time", "EMOM"],
            description: "Effort intense. Format variable selon le jour.",
          },
          {
            label: "Bloc 4 — Finisher",
            description: "Lun=Cardio · Mar=Core · Mer=Renfo · Jeu=Cardio · Ven=Core · Sam=WOD long",
          },
          {
            label: "Bloc 5 — Cool Down",
            tags: ["Facultatif"],
            description: "Étirements, mobilité, récupération active.",
          },
        ],
      },
    ],
    adaptiveStates: [
      { level: "VERT", description: "Séance complète · Charges prescrites · Intensité 100%" },
      { level: "JAUNE", description: "Volume réduit · Intensité 80% · Finisher allégé" },
      { level: "ROUGE", description: "Warm Up + Mobilité uniquement · Pas de WOD" },
    ],
    ctaLabel: "Commencer avec CrossFit Pure →",
  },

  "hybrid-cf-strength": {
    slug: "hybrid-cf-strength",
    name: "Hybrid Engine",
    tagline: "CrossFit × Musculation × Récupération adaptative",
    shortDescription: "Force conjuguée, hypertrophie ciblée, récupération choisie.",
    sessionGroups: [
      {
        title: "JOUR CROSSFIT — Structure identique à CrossFit Pure",
        blocks: [
          { label: "Bloc 1 — Warm Up", tags: ["Not For Time"], description: "" },
          { label: "Bloc 2 — Skill / Strength", tags: ["Build to Heavy"], description: "" },
          { label: "Bloc 3 — WOD", tags: ["AMRAP", "For Time", "EMOM"], description: "" },
          { label: "Bloc 4 — Finisher", description: "" },
          { label: "Bloc 5 — Cool Down", tags: ["Facultatif"], description: "" },
        ],
      },
      {
        title: "JOUR MUSCULATION — Structure Volume Block",
        blocks: [
          { label: "Bloc 1 — Warm Up", tags: ["Not For Time"], description: "" },
          { label: "Bloc 2 — Main Lift", tags: ["Build to Heavy"], description: "" },
          { label: "Bloc 3 — Accessory 1", tags: ["Not For Time"], description: "" },
          { label: "Bloc 4 — Accessory 2", tags: ["Not For Time"], description: "" },
          { label: "Bloc 5 — Cool Down", tags: ["Facultatif"], description: "" },
        ],
      },
      {
        title: "JOUR ADAPTATIF",
        blocks: [
          { label: "Faible fatigue", description: "Course / Boxe / Natation" },
          { label: "Fatigue modérée", description: "Marche / Natation douce" },
          { label: "Fatigue élevée", description: "Repos complet" },
        ],
      },
    ],
    adaptiveStates: [
      { level: "VERT", description: "Jour CrossFit ou Musculation selon planning · Intensité 100%" },
      { level: "JAUNE", description: "Séance allégée · Jour adaptatif recommandé" },
      { level: "ROUGE", description: "Jour adaptatif automatique · Repos ou récupération douce" },
    ],
    ctaLabel: "Commencer avec Hybrid Engine →",
  },

  "hyrox-pure": {
    slug: "hyrox-pure",
    name: "Hyrox Pure",
    shortDescription: "Six jours par semaine. Chaque séance te rapproche de la ligne de départ.",
    sessionGroups: [
      {
        blocks: [
          {
            label: "Bloc 1 — Warm Up",
            tags: ["Not For Time"],
            duration: "15 min",
            description: "Activation cardio, mobilité articulaire, mouvements spécifiques Hyrox.",
          },
          {
            label: "Bloc 2 — Force",
            tags: ["Build to Heavy"],
            duration: "20-25 min",
            description: "Jambes ou haut du corps selon le jour.",
          },
          {
            label: "Bloc 3 — Metcon / Simulation",
            tags: ["For Time"],
            duration: "20-30 min",
            description: "Compromised running, stations, simulation half ou full.",
          },
          {
            label: "Bloc 4 — Renfo Adaptatif",
            tags: ["Not For Time"],
            duration: "10-15 min",
            description: "Travail complémentaire selon les faiblesses du jour.",
          },
          {
            label: "Bloc 5 — Cool Down",
            tags: ["Facultatif"],
            description: "Mobilité, récupération active.",
          },
        ],
      },
    ],
    weeklySplit: [
      { day: "Lun", focus: "Force jambes" },
      { day: "Mar", focus: "Intervalles compromised running" },
      { day: "Mer", focus: "Simulation stations" },
      { day: "Jeu", focus: "Force haut du corps" },
      { day: "Ven", focus: "Zone 2 longue" },
      { day: "Sam", focus: "Simulation half ou full" },
    ],
    adaptiveStates: [
      { level: "VERT", description: "Séance complète · Simulation au pace compétition" },
      { level: "JAUNE", description: "Volume réduit · Pas de simulation · Force uniquement" },
      { level: "ROUGE", description: "Zone 2 douce · Mobilité · Pas de compromised running" },
    ],
    ctaLabel: "Commencer avec Hyrox Pure →",
  },

  "volume-block-hypertrophy": {
    slug: "volume-block-hypertrophy",
    name: "Volume Block Hypertrophy",
    shortDescription: "Upper, Lower, Push, Pull, Legs. La progression s'autopilote.",
    sessionGroups: [
      {
        blocks: [
          {
            label: "Bloc 1 — Warm Up",
            tags: ["Not For Time"],
            description: "Activation musculaire ciblée selon le split du jour.",
          },
          {
            label: "Bloc 2 — Main Lift",
            tags: ["Build to Heavy"],
            duration: "20-25 min",
            description: "Levé lourd, progression chargée.",
          },
          {
            label: "Bloc 3 — Accessory 1",
            tags: ["Not For Time"],
            duration: "10-15 min",
            description: "Exercice complémentaire ciblé.",
          },
          {
            label: "Bloc 4 — Accessory 2",
            tags: ["Not For Time"],
            duration: "10-15 min",
            description: "Exercice complémentaire secondaire.",
          },
          {
            label: "Bloc 5 — Cool Down",
            tags: ["Facultatif"],
            description: "Étirements ciblés selon le split du jour.",
          },
        ],
      },
    ],
    weeklySplit: [
      { day: "Lun", focus: "Upper" },
      { day: "Mar", focus: "Lower" },
      { day: "Mer", focus: "Push" },
      { day: "Jeu", focus: "Pull" },
      { day: "Ven", focus: "Legs" },
    ],
    extraNote: {
      title: "PROGRESSION AUTOPILOTÉE",
      lines: ["+1 rep par set → plafond atteint", "+1 set supplémentaire → plafond atteint", "+charge"],
    },
    adaptiveStates: [
      { level: "VERT", description: "Séance complète · Progression chargée · PR possible" },
      { level: "JAUNE", description: "Volume réduit · Charges maintenues · Pas de PR" },
      { level: "ROUGE", description: "Accessory léger uniquement · Pas de Main Lift lourd" },
    ],
    ctaLabel: "Commencer avec Volume Block Hypertrophy →",
  },

  "at-home": {
    slug: "at-home",
    name: "At Home",
    shortDescription: "Poids du corps en priorité. Aucune excuse, aucun équipement obligatoire.",
    sessionGroups: [
      {
        blocks: [
          {
            label: "Bloc 1 — Warm Up",
            tags: ["Not For Time"],
            duration: "8-10 min",
            description: "Jumping jacks, mobilité articulaire, montées de genoux.",
          },
          {
            label: "Bloc 2 — Main Block",
            tags: ["AMRAP", "For Time"],
            duration: "15-20 min",
            description: "100% bodyweight. Pompes, squats, fentes, burpees...",
          },
          {
            label: "Bloc 3 — Accessory 1",
            tags: ["Not For Time"],
            duration: "10 min",
            description: "Gainage, dips chaise, glute bridge...",
          },
          {
            label: "Bloc 4 — Accessory 2",
            tags: ["Not For Time"],
            duration: "10 min",
            description: "Core, mountain climbers, hollow body...",
          },
          {
            label: "Bloc 5 — Cool Down",
            tags: ["Facultatif"],
            description: "Étirements, mobilité. Option run extérieur.",
          },
        ],
      },
    ],
    weeklySplit: [
      { day: "Lun", focus: "Full Body Force" },
      { day: "Mar", focus: "Cardio bodyweight" },
      { day: "Mer", focus: "Core & Gainage" },
      { day: "Jeu", focus: "Full Body Force" },
      { day: "Ven", focus: "Cardio bodyweight" },
      { day: "Sam", focus: "Run extérieur ou récupération active" },
    ],
    adaptiveStates: [
      { level: "VERT", description: "Séance complète · Intensité max · Option run extérieur" },
      { level: "JAUNE", description: "Volume réduit · Intensité 80% · Accessory uniquement" },
      { level: "ROUGE", description: "Marche extérieure · Mobilité douce · Pas de WOD" },
    ],
    ctaLabel: "Commencer avec At Home →",
  },
};

export function getProgramDetailContent(slug: string) {
  return programDetailContent[slug];
}
