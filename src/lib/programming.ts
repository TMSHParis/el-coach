// Programmations — 4 templates (CrossFit pure, Hybride, Hyrox pure, At-home).
// Chaque template expose une semaine-type détaillée (base répétable pour un cycle).
// Les mouvements sont référencés par `movementId` depuis movements.ts.

import { getMovement, type Movement } from "./movements";

// ============================================================================
// Types
// ============================================================================

export type Discipline = "crossfit" | "hybrid" | "hyrox" | "home" | "hypertrophy";

export type BlockType =
  | "warmup"
  | "strength"
  | "skill"
  | "wod"
  | "accessory"
  | "conditioning"
  | "endurance"
  | "cooldown";

export type WodFormat =
  | "AMRAP"
  | "EMOM"
  | "E2MOM"
  | "E3MOM"
  | "ForTime"
  | "Tabata"
  | "Chipper"
  | "RFT"
  | "Intervals"
  | "StraightSets"
  | "Superset"
  | "Circuit"
  | "Simulation";

export type Exercise = {
  movementId: string; // clé dans movements.ts
  sets?: number;
  reps?: number | string; // "8-10", "AMRAP", "max"
  time?: string; // "30s", "2min"
  distance?: string; // "400m", "1km"
  load?: string; // "75% 1RM", "20/14kg", "BW"
  tempo?: string; // "3-1-1-0"
  rest?: string; // "90s", "2min"
  notes?: string;
};

export type Block = {
  name: string;
  type: BlockType;
  format?: WodFormat;
  duration?: string; // durée totale du bloc
  rounds?: number;
  exercises: Exercise[];
  notes?: string;
};

export type Day = {
  day: number; // 1 = lundi
  focus: string;
  estimatedMinutes: number;
  blocks: Block[];
  adaptive?: boolean; // true = généré au runtime (ex: cooldown Hybride)
  notes?: string;
};

export type Week = {
  weekNumber: number;
  theme?: string;
  days: Day[];
};

export type ProgramTemplate = {
  slug: string;
  name: string;
  discipline: Discipline;
  level: "beginner" | "intermediate" | "advanced";
  daysPerWeek: number;
  equipment: string[];
  summary: string;
  weeks: Week[];
};

// ============================================================================
// Cooldown adaptatif (Hybride — jour de récup modulé par la fatigue)
// ============================================================================

export type CooldownModality = "walk" | "run" | "boxing" | "swim" | "rest";

export type FatigueInput = {
  // Score 0-10 par dimension (auto-déclaré par l'athlète en début de journée).
  sleepDebt: number; // 0 = dormi 8h+, 10 = nuit blanche
  muscleSoreness: number; // 0 = aucune, 10 = très douloureux
  rpeAvg: number; // RPE moyen des 3 dernières séances (0-10)
  motivation: number; // 0 = zéro envie, 10 = feu
};

export function computeFatigueScore(f: FatigueInput): number {
  // Pondération : charge perçue (RPE) et sommeil comptent double.
  const raw = f.sleepDebt * 2 + f.muscleSoreness + f.rpeAvg * 2 - f.motivation;
  // Normalisation approximative sur 0-10.
  return Math.max(0, Math.min(10, raw / 5));
}

export function pickCooldown(fatigueScore: number): { modality: CooldownModality; block: Block } {
  if (fatigueScore >= 8) {
    return {
      modality: "rest",
      block: {
        name: "Repos complet",
        type: "cooldown",
        duration: "0min",
        exercises: [
          { movementId: "foam-roll", time: "10min", notes: "Option mobilité passive si envie, sinon off complet." },
        ],
        notes: "Fatigue très élevée : prioriser sommeil, hydratation, alimentation. Zéro culpabilité.",
      },
    };
  }
  if (fatigueScore >= 6) {
    return {
      modality: "walk",
      block: {
        name: "Marche Zone 1",
        type: "cooldown",
        duration: "45min",
        exercises: [
          { movementId: "zone1-walk", distance: "4-5km", notes: "Rythme conversationnel strict, nez fermé possible." },
          { movementId: "hip-90-90", time: "3min" },
          { movementId: "thoracic-rot", time: "3min" },
        ],
        notes: "Drainage + recharge parasympathique.",
      },
    };
  }
  if (fatigueScore >= 4) {
    return {
      modality: "swim",
      block: {
        name: "Nage technique",
        type: "cooldown",
        duration: "30-40min",
        exercises: [
          { movementId: "swim", distance: "800-1200m", notes: "Crawl technique + dos crawlé, aucune oppression." },
          { movementId: "banded-shoulder", time: "3min" },
        ],
        notes: "Charge zéro impact, mobilité épaule/hanche gagnée sans coût neural.",
      },
    };
  }
  if (fatigueScore >= 2) {
    return {
      modality: "run",
      block: {
        name: "Footing Zone 2",
        type: "cooldown",
        duration: "35-45min",
        exercises: [
          { movementId: "run", distance: "5-7km", notes: "Allure Z2 (~70% FCM). Construit l'aérobie sans pic." },
          { movementId: "foam-roll", time: "5min" },
        ],
        notes: "Meilleur ROI aérobie quand la récup est bonne.",
      },
    };
  }
  return {
    modality: "boxing",
    block: {
      name: "Séance boxe technique",
      type: "cooldown",
      duration: "40min",
      exercises: [
        { movementId: "shadow-boxing", time: "3min", sets: 3, rest: "1min", notes: "Jeu de jambes + combinaisons directes." },
        { movementId: "boxing-bag", time: "3min", sets: 5, rest: "1min", notes: "Round travail sac, enchaînements 1-2-3-crochet." },
        { movementId: "hollow-hold", time: "45s", sets: 3, rest: "15s" },
      ],
      notes: "Fraîcheur élevée : autorisation de décharger du stress + gagner en coordination.",
    },
  };
}

// ============================================================================
// Utils communs
// ============================================================================

const WARMUP_GENERIC: Block = {
  name: "Échauffement général",
  type: "warmup",
  duration: "10min",
  exercises: [
    { movementId: "row", time: "3min", notes: "Progressif, allure facile." },
    { movementId: "thoracic-rot", time: "1min" },
    { movementId: "hip-90-90", time: "1min" },
    { movementId: "air-squat", reps: 15 },
    { movementId: "hollow-hold", time: "30s" },
    { movementId: "pushup", reps: 10 },
  ],
};

const COOLDOWN_BASIC: Block = {
  name: "Retour au calme",
  type: "cooldown",
  duration: "8min",
  exercises: [
    { movementId: "zone1-walk", time: "3min" },
    { movementId: "pigeon", time: "2min" },
    { movementId: "foam-roll", time: "3min", notes: "Quadriceps, mollets, dorsaux." },
  ],
};

// ============================================================================
// 1) CROSSFIT PURE
// ============================================================================

const CROSSFIT_WEEK_1: Week = {
  weekNumber: 1,
  theme: "Bloc 1 · Accumulation — volume modéré, technique priorité",
  days: [
    {
      day: 1,
      focus: "Squat lourd + couplet court",
      estimatedMinutes: 75,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — Back Squat",
          type: "strength",
          format: "StraightSets",
          exercises: [
            { movementId: "back-squat", sets: 5, reps: 5, load: "75-80% 1RM", rest: "2-3min", notes: "Wave set : 5-5-5-5-5." },
          ],
        },
        {
          name: "B — Metcon",
          type: "wod",
          format: "ForTime",
          duration: "sub 8min",
          exercises: [
            { movementId: "thruster", reps: 21, load: "43/30kg" },
            { movementId: "kipping-pullup", reps: 21 },
            { movementId: "thruster", reps: 15, load: "43/30kg" },
            { movementId: "kipping-pullup", reps: 15 },
            { movementId: "thruster", reps: 9, load: "43/30kg" },
            { movementId: "kipping-pullup", reps: 9 },
          ],
          notes: "Référence Fran.",
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 2,
      focus: "Snatch technique + gymnastics skill",
      estimatedMinutes: 80,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — Snatch complex",
          type: "skill",
          format: "E2MOM",
          duration: "14min",
          exercises: [
            { movementId: "power-snatch", reps: 1, notes: "Enchaînement avec OHS." },
            { movementId: "overhead-squat", reps: 2, load: "progressif, technique avant charge" },
          ],
        },
        {
          name: "B — Gym skill",
          type: "skill",
          duration: "10min",
          exercises: [
            { movementId: "handstand-walk", distance: "5-10m", sets: 5, rest: "60s", notes: "Scale : wall walk × 2." },
          ],
        },
        {
          name: "C — EMOM 12'",
          type: "conditioning",
          format: "EMOM",
          duration: "12min",
          exercises: [
            { movementId: "row", distance: "250/220m", notes: "Min 1." },
            { movementId: "burpee", reps: 12, notes: "Min 2." },
            { movementId: "t2b", reps: 12, notes: "Min 3." },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 3,
      focus: "Aerobic long + core",
      estimatedMinutes: 55,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — Long EMOM 30'",
          type: "conditioning",
          format: "EMOM",
          duration: "30min",
          exercises: [
            { movementId: "assault-bike", time: "50s", notes: "Min 1 · allure soutenable." },
            { movementId: "wall-ball", reps: 15, load: "9/6kg", notes: "Min 2." },
            { movementId: "db-box-step-up", reps: 10, load: "2×22.5/15kg", notes: "Min 3." },
          ],
          notes: "Objectif : même split du début à la fin. Zone aérobie dure.",
        },
        {
          name: "B — Core",
          type: "accessory",
          format: "Circuit",
          rounds: 3,
          exercises: [
            { movementId: "ghd-situp", reps: 15, notes: "Scale : V-ups." },
            { movementId: "plank", time: "60s" },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 4,
      focus: "Deadlift + Clean & Jerk + benchmark",
      estimatedMinutes: 80,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — Deadlift heavy",
          type: "strength",
          format: "StraightSets",
          exercises: [
            { movementId: "deadlift", sets: 5, reps: 3, load: "80% 1RM", rest: "2min" },
          ],
        },
        {
          name: "B — Clean & Jerk",
          type: "skill",
          format: "E2MOM",
          duration: "12min",
          exercises: [{ movementId: "clean-and-jerk", reps: 2, load: "70-80%, monter si propre" }],
        },
        {
          name: "C — Metcon",
          type: "wod",
          format: "ForTime",
          duration: "sub 7min",
          exercises: [
            { movementId: "clean-and-jerk", reps: 30, load: "60/42.5kg", notes: "Référence Grace." },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 5,
      focus: "Gymnastic density + long AMRAP",
      estimatedMinutes: 75,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — Gym density",
          type: "skill",
          format: "E3MOM",
          duration: "15min",
          exercises: [
            { movementId: "strict-pullup", reps: 5 },
            { movementId: "hspu", reps: 5, notes: "Scale : pike pushup." },
            { movementId: "t2b", reps: 10 },
          ],
        },
        {
          name: "B — AMRAP 20'",
          type: "wod",
          format: "AMRAP",
          duration: "20min",
          exercises: [
            { movementId: "run", distance: "400m" },
            { movementId: "kb-swing-american", reps: 20, load: "24/16kg" },
            { movementId: "box-jump-over", reps: 15, load: "24/20in" },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 6,
      focus: "Long chipper partenaire",
      estimatedMinutes: 65,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "Chipper partner (50/50)",
          type: "wod",
          format: "Chipper",
          duration: "sub 35min",
          exercises: [
            { movementId: "row", distance: "3000m" },
            { movementId: "bar-facing-burpee", reps: 100 },
            { movementId: "wall-ball", reps: 150, load: "9/6kg" },
            { movementId: "t2b", reps: 100 },
            { movementId: "run", distance: "1600m" },
          ],
          notes: "Partitionner librement avec le partenaire. Solo : couper le volume de moitié.",
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 7,
      focus: "Repos complet",
      estimatedMinutes: 0,
      blocks: [],
      notes: "OFF · marche facile 20-30min optionnelle.",
    },
  ],
};

export const CROSSFIT_PURE: ProgramTemplate = {
  slug: "crossfit-pure",
  name: "CrossFit Pure",
  discipline: "crossfit",
  level: "intermediate",
  daysPerWeek: 6,
  equipment: ["barbell", "rack", "rower", "assault_bike", "pullup_bar", "rings", "wallball", "kettlebell", "dumbbell", "box"],
  summary:
    "Squat, tirage, press. Arraché, épaulé. Muscle-up, handstand. Metcons qui brûlent. Une programmation conjuguée. Rien n'est laissé au hasard.",
  weeks: [CROSSFIT_WEEK_1],
};

// ============================================================================
// 2) HYBRID ENGINE — CrossFit (Lun/Jeu/Dim opt) + Musculation (Mar/Ven)
//    + Cooldown adaptatif (Mer) + Repos (Sam)
// ============================================================================

const HYBRID_WEEK_1: Week = {
  weekNumber: 1,
  theme: "Bloc 1 · Engine hybride · CF lourd lun/jeu, musculation mar/ven, cooldown adaptatif mer",
  days: [
    {
      day: 1,
      focus: "CrossFit · Squat lourd + couplet court",
      estimatedMinutes: 75,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — Back Squat",
          type: "strength",
          format: "StraightSets",
          exercises: [
            { movementId: "back-squat", sets: 5, reps: 5, load: "75-80% 1RM", rest: "2-3min" },
          ],
        },
        {
          name: "B — Metcon",
          type: "wod",
          format: "ForTime",
          duration: "sub 8min",
          exercises: [
            { movementId: "thruster", reps: 21, load: "43/30kg" },
            { movementId: "kipping-pullup", reps: 21 },
            { movementId: "thruster", reps: 15, load: "43/30kg" },
            { movementId: "kipping-pullup", reps: 15 },
            { movementId: "thruster", reps: 9, load: "43/30kg" },
            { movementId: "kipping-pullup", reps: 9 },
          ],
          notes: "Référence Fran.",
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 2,
      focus: "Musculation · Push hypertrophie",
      estimatedMinutes: 70,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — Bench Press",
          type: "strength",
          format: "StraightSets",
          exercises: [{ movementId: "bench-press", sets: 4, reps: 8, load: "70-75% 1RM", rest: "2min" }],
        },
        {
          name: "B — Strict Press",
          type: "strength",
          format: "StraightSets",
          exercises: [{ movementId: "strict-press", sets: 4, reps: 8, load: "65% 1RM", rest: "2min" }],
        },
        {
          name: "C — Accessoires push",
          type: "accessory",
          format: "Superset",
          exercises: [
            { movementId: "ring-dip", sets: 3, reps: 8, notes: "Scale : box dip." },
            { movementId: "db-bench", sets: 3, reps: 12, load: "modéré" },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 3,
      focus: "Cooldown adaptatif (walk / run / boxing / swim / rest)",
      estimatedMinutes: 40,
      adaptive: true,
      blocks: [
        {
          name: "Généré selon fatigue hebdomadaire",
          type: "cooldown",
          exercises: [],
          notes:
            "Résolu au runtime par pickCooldown(fatigueScore). Input : sommeil, courbatures, RPE moyen 3 dernières séances, motivation. Output : walk Z1 · footing Z2 · nage technique · boxe technique · repos complet.",
        },
      ],
    },
    {
      day: 4,
      focus: "CrossFit · Deadlift + metcon long",
      estimatedMinutes: 80,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — Deadlift heavy",
          type: "strength",
          format: "StraightSets",
          exercises: [
            { movementId: "deadlift", sets: 5, reps: 3, load: "80% 1RM", rest: "2min" },
          ],
        },
        {
          name: "B — Clean & Jerk",
          type: "skill",
          format: "E2MOM",
          duration: "12min",
          exercises: [{ movementId: "clean-and-jerk", reps: 2, load: "70-80%, monter si propre" }],
        },
        {
          name: "C — AMRAP 20'",
          type: "wod",
          format: "AMRAP",
          duration: "20min",
          exercises: [
            { movementId: "run", distance: "400m" },
            { movementId: "kb-swing-american", reps: 20, load: "24/16kg" },
            { movementId: "box-jump-over", reps: 15, load: "24/20in" },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 5,
      focus: "Musculation · Pull + posterior",
      estimatedMinutes: 70,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — Strict Pull-up lesté",
          type: "strength",
          format: "StraightSets",
          exercises: [
            { movementId: "strict-pullup", sets: 5, reps: 5, notes: "Lesté si 10+ à vide. Scale : ring row." },
          ],
        },
        {
          name: "B — RDL",
          type: "strength",
          format: "StraightSets",
          exercises: [{ movementId: "rdl", sets: 4, reps: 8, load: "modéré-lourd", rest: "2min" }],
        },
        {
          name: "C — Accessoires pull + biceps",
          type: "accessory",
          format: "Superset",
          exercises: [
            { movementId: "db-row", sets: 4, reps: 12, load: "lourd", notes: "Par bras." },
            { movementId: "kb-row", sets: 3, reps: 12, notes: "Tempo contrôlé." },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 6,
      focus: "Repos complet",
      estimatedMinutes: 0,
      blocks: [],
      notes: "OFF total. Sommeil, nutrition, famille.",
    },
    {
      day: 7,
      focus: "CrossFit optionnel · Long metcon ou OFF",
      estimatedMinutes: 60,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — Long AMRAP",
          type: "wod",
          format: "AMRAP",
          duration: "30min",
          exercises: [
            { movementId: "row", distance: "500m" },
            { movementId: "devils-press", reps: 10, load: "2×22.5/15kg" },
            { movementId: "box-jump-over", reps: 15, load: "24/20in" },
            { movementId: "t2b", reps: 15 },
          ],
          notes: "Allure stable, conversation possible.",
        },
        COOLDOWN_BASIC,
      ],
      notes: "Optionnel. Sauter sans culpabilité si fatigue, vie de famille, ou semaine chargée.",
    },
  ],
};

export const HYBRID: ProgramTemplate = {
  slug: "hybrid-cf-strength",
  name: "Hybrid Engine (Hybrid · CrossFit × Musculation)",
  discipline: "hybrid",
  level: "intermediate",
  daysPerWeek: 5,
  equipment: ["barbell", "rack", "bench", "dumbbell", "kettlebell", "wallball", "pullup_bar", "sled", "rower", "outdoor"],
  summary:
    "CrossFit × Musculation × Récupération adaptative. Force conjuguée, hypertrophie ciblée, récupération choisie. Boxe, natation, marche ou repos — selon ce que le corps demande.",
  weeks: [HYBRID_WEEK_1],
};

// ============================================================================
// 3) HYROX PURE
// ============================================================================

const HYROX_WEEK_1: Week = {
  weekNumber: 1,
  theme: "Bloc 1 · Base aérobie + volume stations",
  days: [
    {
      day: 1,
      focus: "Force legs + sled volume",
      estimatedMinutes: 75,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — Back Squat",
          type: "strength",
          format: "StraightSets",
          exercises: [{ movementId: "back-squat", sets: 5, reps: 5, load: "75% 1RM", rest: "2min" }],
        },
        {
          name: "B — Sled work",
          type: "conditioning",
          format: "Intervals",
          exercises: [
            { movementId: "sled-push", distance: "25m", sets: 8, load: "100/75kg", rest: "90s", notes: "Effort 85%." },
            { movementId: "sled-pull", distance: "25m", sets: 6, load: "80/60kg", rest: "90s" },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 2,
      focus: "Running intervals + wall ball (compromised)",
      estimatedMinutes: 70,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — Intervals 6×800m",
          type: "endurance",
          format: "Intervals",
          exercises: [
            { movementId: "run", distance: "800m", sets: 6, rest: "90s", notes: "Allure cible : pace Hyrox + 10s/km." },
          ],
        },
        {
          name: "B — Wall ball density",
          type: "conditioning",
          format: "EMOM",
          duration: "12min",
          exercises: [{ movementId: "wall-ball", reps: 15, load: "9/6kg", notes: "Chaque minute." }],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 3,
      focus: "Upper strength + ski/row intervals",
      estimatedMinutes: 65,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — Strict Press + Pull-up",
          type: "strength",
          format: "Superset",
          exercises: [
            { movementId: "strict-press", sets: 4, reps: 6, load: "75% 1RM" },
            { movementId: "strict-pullup", sets: 4, reps: 6, notes: "Lesté si 10+ à vide." },
          ],
        },
        {
          name: "B — Ski/Row intervals",
          type: "conditioning",
          format: "Intervals",
          exercises: [
            { movementId: "ski-erg", distance: "500m", sets: 4, rest: "2min", notes: "Pace cible Hyrox." },
            { movementId: "row", distance: "500m", sets: 4, rest: "2min" },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 4,
      focus: "Compromised running (demi-simulation)",
      estimatedMinutes: 75,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — 4 stations partielles",
          type: "wod",
          format: "Simulation",
          duration: "sub 35min",
          exercises: [
            { movementId: "run", distance: "1000m" },
            { movementId: "ski-erg", distance: "1000m" },
            { movementId: "run", distance: "1000m" },
            { movementId: "sled-push", distance: "50m", load: "charge compet" },
            { movementId: "run", distance: "1000m" },
            { movementId: "sled-pull", distance: "50m", load: "charge compet" },
            { movementId: "run", distance: "1000m" },
            { movementId: "burpee-broad-jump", distance: "80m" },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 5,
      focus: "Long Z2 + core",
      estimatedMinutes: 75,
      blocks: [
        {
          name: "A — Run Zone 2",
          type: "endurance",
          duration: "60min",
          exercises: [{ movementId: "run", distance: "11-12km", notes: "Allure conversation, FC stable." }],
        },
        {
          name: "B — Core",
          type: "accessory",
          format: "Circuit",
          rounds: 3,
          exercises: [
            { movementId: "plank", time: "60s" },
            { movementId: "pallof-press", reps: 12 },
            { movementId: "kb-suitcase-carry", distance: "30m", notes: "Par côté." },
          ],
        },
      ],
    },
    {
      day: 6,
      focus: "Simulation half-Hyrox",
      estimatedMinutes: 70,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "Half-Hyrox (stations 1-4 + runs)",
          type: "wod",
          format: "Simulation",
          exercises: [
            { movementId: "run", distance: "1000m" },
            { movementId: "ski-erg", distance: "1000m" },
            { movementId: "run", distance: "1000m" },
            { movementId: "sled-push", distance: "50m", load: "charge compet" },
            { movementId: "run", distance: "1000m" },
            { movementId: "sled-pull", distance: "50m", load: "charge compet" },
            { movementId: "run", distance: "1000m" },
            { movementId: "burpee-broad-jump", distance: "80m" },
          ],
          notes: "Mesurer split de chaque station + chaque run. Benchmark.",
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 7,
      focus: "Repos",
      estimatedMinutes: 0,
      blocks: [],
    },
  ],
};

export const HYROX_PURE: ProgramTemplate = {
  slug: "hyrox-pure",
  name: "Hyrox Pure",
  discipline: "hyrox",
  level: "intermediate",
  daysPerWeek: 6,
  equipment: ["rower", "ski_erg", "sled", "kettlebell", "sandbag", "wallball", "outdoor"],
  summary:
    "Six jours par semaine. Force jambes, force haut du corps, intervalles en compromised running. Simulations half et full. Zone 2 longue. Stations travaillées en volume au pace compétition. Chaque séance te rapproche de la ligne de départ.",
  weeks: [HYROX_WEEK_1],
};

// ============================================================================
// 4) AT HOME — équipement minimal (DB/KB optionnels)
// ============================================================================

const HOME_WEEK_1: Week = {
  weekNumber: 1,
  theme: "Bloc 1 · Bodyweight + cardio · DB/KB optionnels",
  days: [
    {
      day: 1,
      focus: "Lower bodyweight + core",
      estimatedMinutes: 35,
      blocks: [
        {
          name: "Warmup",
          type: "warmup",
          duration: "5min",
          exercises: [
            { movementId: "air-squat", reps: 20 },
            { movementId: "walking-lunge", reps: 20 },
            { movementId: "hip-90-90", time: "1min" },
          ],
        },
        {
          name: "A — AMRAP 20'",
          type: "wod",
          format: "AMRAP",
          duration: "20min",
          exercises: [
            { movementId: "air-squat", reps: 20 },
            { movementId: "jumping-lunge", reps: 20 },
            { movementId: "jump-squat", reps: 15 },
            { movementId: "broad-jump", reps: 10 },
          ],
        },
        {
          name: "B — Core",
          type: "accessory",
          format: "Circuit",
          rounds: 3,
          exercises: [
            { movementId: "hollow-hold", time: "30s" },
            { movementId: "plank", time: "45s" },
            { movementId: "dead-bug", reps: 10 },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 2,
      focus: "Cardio impact + core",
      estimatedMinutes: 40,
      blocks: [
        {
          name: "Warmup",
          type: "warmup",
          duration: "5min",
          exercises: [
            { movementId: "single-under", time: "2min" },
            { movementId: "bear-crawl", time: "1min" },
          ],
        },
        {
          name: "A — Intervals corde / course",
          type: "conditioning",
          format: "Intervals",
          exercises: [
            { movementId: "double-under", reps: 50, sets: 6, rest: "60s", notes: "Scale : 150 single under par round." },
            { movementId: "run", distance: "400m", sets: 4, rest: "90s", notes: "Option si extérieur." },
          ],
        },
        {
          name: "B — Core",
          type: "accessory",
          format: "Circuit",
          rounds: 3,
          exercises: [
            { movementId: "hollow-rock", reps: 20 },
            { movementId: "arch-hold", time: "30s" },
          ],
        },
      ],
    },
    {
      day: 3,
      focus: "Upper bodyweight (push/pull)",
      estimatedMinutes: 40,
      blocks: [
        {
          name: "Warmup",
          type: "warmup",
          duration: "5min",
          exercises: [
            { movementId: "pushup", reps: 10 },
            { movementId: "bear-crawl", time: "1min" },
            { movementId: "banded-shoulder", time: "1min" },
          ],
        },
        {
          name: "A — Push density",
          type: "strength",
          format: "EMOM",
          duration: "12min",
          exercises: [
            { movementId: "pushup", reps: 12, notes: "Min impair · HR si possible." },
            { movementId: "pike-pushup", reps: 8, notes: "Min pair. Progression vers HSPU." },
          ],
        },
        {
          name: "B — Pull bodyweight",
          type: "accessory",
          format: "Circuit",
          rounds: 4,
          exercises: [
            { movementId: "ring-row", reps: 12, notes: "Scale : rangers sous table solide." },
            { movementId: "db-row", reps: 10, load: "si DB dispo · sinon bouteille lestée" },
          ],
        },
        {
          name: "C — Finisher core",
          type: "conditioning",
          format: "Tabata",
          duration: "4min",
          exercises: [
            { movementId: "hollow-rock", time: "20s", rest: "10s", sets: 4 },
            { movementId: "plank", time: "20s", rest: "10s", sets: 4 },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 4,
      focus: "Mobilité / repos actif",
      estimatedMinutes: 25,
      blocks: [
        {
          name: "Mobilité globale",
          type: "cooldown",
          format: "Circuit",
          rounds: 2,
          exercises: [
            { movementId: "hip-90-90", time: "2min" },
            { movementId: "pigeon", time: "2min", notes: "Chaque côté." },
            { movementId: "thoracic-rot", time: "2min" },
            { movementId: "deep-squat-hold", time: "2min" },
            { movementId: "foam-roll", time: "5min" },
          ],
        },
      ],
    },
    {
      day: 5,
      focus: "Full body circuit (DB optionnels)",
      estimatedMinutes: 45,
      blocks: [
        {
          name: "Warmup",
          type: "warmup",
          duration: "5min",
          exercises: [
            { movementId: "air-squat", reps: 15 },
            { movementId: "pushup", reps: 10 },
            { movementId: "hollow-hold", time: "30s" },
          ],
        },
        {
          name: "A — AMRAP 30'",
          type: "wod",
          format: "AMRAP",
          duration: "30min",
          exercises: [
            { movementId: "db-thruster", reps: 12, load: "2×15/10kg ou sac à dos lesté" },
            { movementId: "hr-burpee", reps: 10 },
            { movementId: "walking-lunge", reps: 20 },
            { movementId: "pushup", reps: 15 },
            { movementId: "hollow-rock", reps: 20 },
          ],
          notes: "Scale DB : air squat + pause. Tenir allure stable sur 30'.",
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 6,
      focus: "Endurance longue",
      estimatedMinutes: 55,
      blocks: [
        {
          name: "A — Run ou circuit cardio",
          type: "endurance",
          duration: "45min",
          exercises: [
            { movementId: "run", distance: "7-9km", notes: "Option prioritaire si extérieur." },
            { movementId: "double-under", time: "5min", sets: 6, rest: "2min", notes: "Alternative indoor." },
          ],
        },
        {
          name: "B — Cooldown",
          type: "cooldown",
          duration: "10min",
          exercises: [
            { movementId: "zone1-walk", time: "5min" },
            { movementId: "pigeon", time: "2min" },
            { movementId: "foam-roll", time: "3min" },
          ],
        },
      ],
    },
    {
      day: 7,
      focus: "Repos",
      estimatedMinutes: 0,
      blocks: [],
      notes: "OFF · marche facile en option.",
    },
  ],
};

export const AT_HOME: ProgramTemplate = {
  slug: "at-home",
  name: "At Home",
  discipline: "home",
  level: "beginner",
  daysPerWeek: 5,
  equipment: ["none", "jump_rope", "mat", "dumbbell", "kettlebell"],
  summary:
    "Cinq à six jours par semaine. Poids du corps uniquement, aucun matériel requis. Full body accessible, du débutant à l'intermédiaire. Une sortie run pour l'endurance quand les murs se resserrent. Aucune excuse, aucun équipement obligatoire.",
  weeks: [HOME_WEEK_1],
};

// ============================================================================
// 5) VOLUME BLOCK · HYPERTROPHY — split Upper/Lower/Push/Pull/Legs
//    Bloc volume haute fréquence. Progression série/rep autopilotée :
//    semaine 1 base → +1 rep/série jusqu'au plafond → +1 série → +charge.
// ============================================================================

const HYPER_WEEK_1: Week = {
  weekNumber: 1,
  theme: "Bloc 1 · Accumulation hypertrophie · 5 séances · Upper / Lower / Push / Pull / Legs",
  days: [
    {
      day: 1,
      focus: "Upper full · push + pull équilibré",
      estimatedMinutes: 65,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — Bench Press",
          type: "strength",
          format: "StraightSets",
          exercises: [
            { movementId: "bench-press", sets: 4, reps: "8-10", load: "70-75% 1RM", rest: "2min", notes: "Progression : viser 10 reps × 4 sets avant +charge." },
          ],
        },
        {
          name: "B — Strict Pull-up",
          type: "strength",
          format: "StraightSets",
          exercises: [
            { movementId: "strict-pullup", sets: 4, reps: "6-10", notes: "Lesté si plafond atteint. Scale : ring row." },
          ],
        },
        {
          name: "C — Superset accessoires",
          type: "accessory",
          format: "Superset",
          exercises: [
            { movementId: "db-bench", sets: 3, reps: "10-12", load: "modéré", rest: "60s" },
            { movementId: "db-row", sets: 3, reps: "10-12", notes: "Par bras." },
          ],
        },
        {
          name: "D — Finisher épaules",
          type: "accessory",
          format: "Circuit",
          rounds: 3,
          exercises: [
            { movementId: "strict-press", sets: 1, reps: "12-15", load: "léger" },
            { movementId: "ring-row", sets: 1, reps: "12-15" },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 2,
      focus: "Lower full · squat + hinge",
      estimatedMinutes: 65,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — Back Squat",
          type: "strength",
          format: "StraightSets",
          exercises: [
            { movementId: "back-squat", sets: 4, reps: "8-10", load: "70-75% 1RM", rest: "2-3min", notes: "Progression : 10 reps × 4 sets avant +2.5kg." },
          ],
        },
        {
          name: "B — Romanian Deadlift",
          type: "strength",
          format: "StraightSets",
          exercises: [
            { movementId: "rdl", sets: 4, reps: "8-10", load: "modéré-lourd", rest: "2min", notes: "Tempo 3-0-1." },
          ],
        },
        {
          name: "C — Bulgarian Split Squat",
          type: "accessory",
          format: "StraightSets",
          exercises: [
            { movementId: "db-bulgarian", sets: 3, reps: "10-12", notes: "Par jambe." },
          ],
        },
        {
          name: "D — Calves + core",
          type: "accessory",
          format: "Superset",
          exercises: [
            { movementId: "step-up", sets: 3, reps: "12-15", notes: "Par jambe." },
            { movementId: "plank", sets: 3, time: "60s" },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 3,
      focus: "Push · épaules + pectoraux + triceps",
      estimatedMinutes: 60,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — Strict Press",
          type: "strength",
          format: "StraightSets",
          exercises: [
            { movementId: "strict-press", sets: 5, reps: "5-8", load: "75-80% 1RM", rest: "2min" },
          ],
        },
        {
          name: "B — DB Bench incline",
          type: "strength",
          format: "StraightSets",
          exercises: [
            { movementId: "db-bench", sets: 4, reps: "10-12", load: "modéré", rest: "90s" },
          ],
        },
        {
          name: "C — Push density",
          type: "accessory",
          format: "Circuit",
          rounds: 4,
          exercises: [
            { movementId: "ring-dip", sets: 1, reps: "8-12" },
            { movementId: "pushup", sets: 1, reps: "12-20" },
            { movementId: "pike-pushup", sets: 1, reps: "8-12" },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 4,
      focus: "Pull · dos + biceps + grip",
      estimatedMinutes: 60,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — Deadlift",
          type: "strength",
          format: "StraightSets",
          exercises: [
            { movementId: "deadlift", sets: 4, reps: "5-6", load: "75-80% 1RM", rest: "2-3min" },
          ],
        },
        {
          name: "B — Strict Pull-up volume",
          type: "strength",
          format: "StraightSets",
          exercises: [
            { movementId: "strict-pullup", sets: 5, reps: "AMRAP-1", notes: "Stop 1 rep avant l'échec à chaque set." },
          ],
        },
        {
          name: "C — Rows lourds",
          type: "accessory",
          format: "Superset",
          exercises: [
            { movementId: "db-row", sets: 4, reps: "10-12", load: "lourd", notes: "Par bras." },
            { movementId: "kb-row", sets: 4, reps: "12", notes: "Tempo strict." },
          ],
        },
        {
          name: "D — Grip + carry",
          type: "accessory",
          exercises: [
            { movementId: "farmers-carry", distance: "40m", sets: 4, load: "lourd", rest: "60s" },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 5,
      focus: "Legs · quad + posterior chain volume",
      estimatedMinutes: 65,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — Front Squat",
          type: "strength",
          format: "StraightSets",
          exercises: [
            { movementId: "front-squat", sets: 4, reps: "6-8", load: "70% 1RM", rest: "2min" },
          ],
        },
        {
          name: "B — Walking Lunge lesté",
          type: "strength",
          format: "StraightSets",
          exercises: [
            { movementId: "bb-walking-lunge", sets: 3, reps: 20, load: "modéré", notes: "10 par jambe." },
          ],
        },
        {
          name: "C — Posterior accessoires",
          type: "accessory",
          format: "Superset",
          exercises: [
            { movementId: "kb-swing-russian", sets: 4, reps: "15-20", load: "modéré-lourd" },
            { movementId: "back-ext", sets: 4, reps: "12-15" },
          ],
        },
        {
          name: "D — Core anti-extension",
          type: "accessory",
          format: "Circuit",
          rounds: 3,
          exercises: [
            { movementId: "ab-wheel", sets: 1, reps: "8-12" },
            { movementId: "hollow-hold", sets: 1, time: "45s" },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 6,
      focus: "Repos actif",
      estimatedMinutes: 30,
      blocks: [
        {
          name: "Mobilité + marche",
          type: "cooldown",
          duration: "30min",
          exercises: [
            { movementId: "zone1-walk", time: "20min" },
            { movementId: "hip-90-90", time: "3min" },
            { movementId: "thoracic-rot", time: "3min" },
            { movementId: "foam-roll", time: "5min" },
          ],
          notes: "Optionnel. Marche extérieure prioritaire.",
        },
      ],
      notes: "Recharge parasympathique. Pas de charge ni de cardio dur.",
    },
    {
      day: 7,
      focus: "Repos complet",
      estimatedMinutes: 0,
      blocks: [],
      notes: "OFF total. Sommeil, nutrition, récupération.",
    },
  ],
};

export const VOLUME_BLOCK_HYPERTROPHY: ProgramTemplate = {
  slug: "volume-block-hypertrophy",
  name: "Volume Block · Hypertrophy",
  discipline: "hypertrophy",
  level: "intermediate",
  daysPerWeek: 5,
  equipment: ["barbell", "rack", "bench", "dumbbell", "kettlebell", "pullup_bar", "rings", "box"],
  summary:
    "Upper, Lower, Push, Pull, Legs. Haute fréquence, volume maîtrisé. Une rep de plus, un set de plus, une charge de plus. La progression s'autopilote. Construire du muscle sans se poser de questions.",
  weeks: [HYPER_WEEK_1],
};

// ============================================================================
// Index + helpers
// ============================================================================

export const programTemplates: ProgramTemplate[] = [
  CROSSFIT_PURE,
  HYBRID,
  HYROX_PURE,
  AT_HOME,
  VOLUME_BLOCK_HYPERTROPHY,
];

export function getTemplate(slug: string): ProgramTemplate | undefined {
  return programTemplates.find((t) => t.slug === slug);
}

export function resolveExerciseMovement(exercise: Exercise): Movement | undefined {
  return getMovement(exercise.movementId);
}

/**
 * Applique le cooldown adaptatif sur un jour marqué `adaptive`.
 * Remplace le bloc placeholder par le bloc choisi selon fatigueScore.
 */
export function resolveAdaptiveDay(day: Day, fatigueScore: number): Day {
  if (!day.adaptive) return day;
  const { block, modality } = pickCooldown(fatigueScore);
  return {
    ...day,
    focus: `Cooldown adaptatif · ${modality}`,
    blocks: [block],
  };
}

// ============================================================================
// Helpers d'affichage des blocs (style fiche programmation type SugarWOD)
// ============================================================================

const SECTION_LABELS: Record<BlockType, string> = {
  warmup: "WARM UP",
  strength: "STRENGTH/POWER",
  skill: "SKILL",
  wod: "METCON",
  accessory: "ACCESSORY",
  conditioning: "CONDITIONING",
  endurance: "ENDURANCE",
  cooldown: "COOL DOWN",
};

export function sectionLabel(block: Block): string {
  return SECTION_LABELS[block.type] ?? block.type.toUpperCase();
}

/** Score type affiché en bleu avec trophée à droite du bloc. */
export function scoreType(block: Block): string | null {
  if (block.type === "warmup" || block.type === "cooldown") return "For Completion";
  if (block.type === "strength") return "For Weight";
  if (block.type === "skill") return "For Quality";
  if (block.type === "endurance") {
    return block.format === "Intervals" ? "For Time" : "For Distance";
  }
  const fmt = block.format;
  if (fmt === "ForTime" || fmt === "RFT" || fmt === "Chipper" || fmt === "Simulation")
    return "For Time";
  if (fmt === "AMRAP") return "For Reps";
  if (fmt === "EMOM" || fmt === "E2MOM" || fmt === "E3MOM" || fmt === "Tabata")
    return "For Quality";
  if (fmt === "Intervals") return "For Time";
  if (fmt === "Circuit" || fmt === "Superset" || fmt === "StraightSets")
    return "For Reps";
  return null;
}

/** Sous-titre du bloc — résume le scheme : « 3 Rounds (Not for Time) », « 5 × 4 », « AMRAP 20' », etc. */
export function blockSchemeLine(block: Block): string | null {
  const fmt = block.format;
  const dur = block.duration;
  const rounds = block.rounds;

  if (block.type === "warmup") {
    if (rounds) return `${rounds} Rounds (Not for Time)`;
    if (dur) return `${dur} (Not for Time)`;
    return "Not for Time";
  }
  if (block.type === "cooldown") {
    if (dur) return `${dur} · Cool Down`;
    return "Cool Down";
  }

  if (fmt === "AMRAP" && dur) return `AMRAP ${dur}`;
  if (fmt === "EMOM" && dur) return `EMOM ${dur}`;
  if (fmt === "E2MOM" && dur) return `E2MOM ${dur}`;
  if (fmt === "E3MOM" && dur) return `E3MOM ${dur}`;
  if (fmt === "ForTime" && rounds) return `${rounds} Rounds For Time${dur ? ` (${dur})` : ""}`;
  if (fmt === "ForTime" && dur) return `For Time (${dur})`;
  if (fmt === "ForTime") return "For Time";
  if (fmt === "RFT" && rounds) return `${rounds} Rounds For Time`;
  if (fmt === "Tabata") return `Tabata · ${rounds ?? 8} rounds (20s/10s)`;
  if (fmt === "Intervals") return "Intervals";
  if (fmt === "Chipper") return `Chipper${dur ? ` (${dur})` : ""}`;
  if (fmt === "Simulation") return `Simulation${dur ? ` (${dur})` : ""}`;
  if (fmt === "Circuit" && rounds) return `${rounds} Rounds`;
  if (fmt === "Superset") return `Superset${rounds ? ` × ${rounds}` : ""}`;
  if (fmt === "StraightSets") {
    const ex = block.exercises[0];
    if (ex?.sets !== undefined && ex.reps !== undefined) return `${ex.sets} × ${ex.reps}`;
    if (ex?.sets !== undefined) return `${ex.sets} sets`;
    return "Straight Sets";
  }

  if (dur) return dur;
  if (rounds) return `${rounds} Rounds`;
  return null;
}

/** Lettre du badge (A, B, C, …) — passe « i » pour les notes/instructions. */
export function blockLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

/** Une ligne d'exercice formatée en texte plat type "8 Power Snatch (RX - 95/65)". */
export function formatExerciseLine(
  ex: Exercise,
  movementName: string,
): { primary: string; secondary?: string } {
  const parts: string[] = [];
  if (ex.sets !== undefined && ex.reps !== undefined) parts.push(`${ex.sets} × ${ex.reps}`);
  else if (ex.sets !== undefined && ex.time) parts.push(`${ex.sets} × ${ex.time}`);
  else if (ex.sets !== undefined && ex.distance) parts.push(`${ex.sets} × ${ex.distance}`);
  else if (ex.reps !== undefined) parts.push(String(ex.reps));
  else if (ex.distance) parts.push(ex.distance);
  else if (ex.time) parts.push(ex.time);

  parts.push(movementName);

  if (ex.load) parts.push(`(${ex.load})`);
  if (ex.tempo) parts.push(`tempo ${ex.tempo}`);
  if (ex.rest) parts.push(`· rest ${ex.rest}`);

  return {
    primary: parts.join(" "),
    secondary: ex.notes,
  };
}
