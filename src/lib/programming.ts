// Programmations — 4 templates (CrossFit pure, Hybride, Hyrox pure, At-home).
// Chaque template expose une semaine-type détaillée (base répétable pour un cycle).
// Les mouvements sont référencés par `movementId` depuis movements.ts.

import { getMovement, type Movement } from "./movements";

// ============================================================================
// Types
// ============================================================================

export type Discipline = "crossfit" | "hybrid" | "hyrox" | "home";

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
// 1) CROSSFIT PURE — inspiration CompTrain / Mayhem / Project BEEF
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
    "Programmation CrossFit conjugate : force (squat / tirage / press) + olympique + gymnastique + metcon varié. Inspiré CompTrain / Mayhem / Project BEEF.",
  weeks: [CROSSFIT_WEEK_1],
};

// ============================================================================
// 2) HYBRID — CrossFit + musculation + 1 jour cooldown adaptatif
// ============================================================================

const HYBRID_WEEK_1: Week = {
  weekNumber: 1,
  theme: "Bloc 1 · Base force-cardio, cooldown adaptatif jeudi",
  days: [
    {
      day: 1,
      focus: "Push hypertrophie + finisher metcon",
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
          name: "B — Accessoires push",
          type: "accessory",
          format: "Superset",
          exercises: [
            { movementId: "strict-press", sets: 3, reps: 10, load: "60% 1RM" },
            { movementId: "ring-dip", sets: 3, reps: 8, notes: "Scale : box dip." },
          ],
        },
        {
          name: "C — Finisher",
          type: "wod",
          format: "AMRAP",
          duration: "10min",
          exercises: [
            { movementId: "db-thruster", reps: 12, load: "2×22.5/15kg" },
            { movementId: "bar-facing-burpee", reps: 10 },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 2,
      focus: "Zone 2 long + core",
      estimatedMinutes: 75,
      blocks: [
        {
          name: "A — Run Zone 2",
          type: "endurance",
          duration: "60min",
          exercises: [
            { movementId: "run", distance: "10km", notes: "Allure Z2 : conversation possible. Si FC > Z2 → marche." },
          ],
        },
        {
          name: "B — Core",
          type: "accessory",
          format: "Circuit",
          rounds: 3,
          exercises: [
            { movementId: "hollow-hold", time: "45s" },
            { movementId: "pallof-press", reps: 12, notes: "Par côté." },
            { movementId: "dead-bug", reps: 10 },
          ],
        },
      ],
    },
    {
      day: 3,
      focus: "Pull hypertrophie + finisher",
      estimatedMinutes: 70,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — Deadlift",
          type: "strength",
          format: "StraightSets",
          exercises: [{ movementId: "deadlift", sets: 4, reps: 6, load: "75% 1RM", rest: "2-3min" }],
        },
        {
          name: "B — Accessoires pull",
          type: "accessory",
          format: "Superset",
          exercises: [
            { movementId: "strict-pullup", sets: 4, reps: 6, notes: "Lesté si possible. Scale : ring row." },
            { movementId: "db-row", sets: 3, reps: 12, load: "lourd", notes: "Par bras." },
          ],
        },
        {
          name: "C — Finisher",
          type: "wod",
          format: "EMOM",
          duration: "10min",
          exercises: [
            { movementId: "kb-swing-american", reps: 15, load: "24/16kg", notes: "Min impair." },
            { movementId: "t2b", reps: 12, notes: "Min pair." },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 4,
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
      day: 5,
      focus: "Legs lourd + Hyrox-style circuit",
      estimatedMinutes: 80,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — Back Squat",
          type: "strength",
          format: "StraightSets",
          exercises: [{ movementId: "back-squat", sets: 5, reps: 5, load: "77.5% 1RM", rest: "2-3min" }],
        },
        {
          name: "B — Unilatéral + posterior",
          type: "accessory",
          format: "Superset",
          exercises: [
            { movementId: "db-bulgarian", sets: 3, reps: 10, notes: "Par jambe." },
            { movementId: "rdl", sets: 3, reps: 10, load: "modéré" },
          ],
        },
        {
          name: "C — Hyrox-style finisher",
          type: "conditioning",
          format: "ForTime",
          duration: "sub 18min",
          exercises: [
            { movementId: "run", distance: "800m" },
            { movementId: "sled-push", distance: "30m", load: "80kg/60kg" },
            { movementId: "run", distance: "800m" },
            { movementId: "wall-ball", reps: 50, load: "9/6kg" },
            { movementId: "run", distance: "800m" },
            { movementId: "farmers-carry", distance: "100m", load: "2×24/16kg" },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 6,
      focus: "Full-body metcon mixte",
      estimatedMinutes: 60,
      blocks: [
        WARMUP_GENERIC,
        {
          name: "A — AMRAP 25'",
          type: "wod",
          format: "AMRAP",
          duration: "25min",
          exercises: [
            { movementId: "row", distance: "500m" },
            { movementId: "devils-press", reps: 10, load: "2×22.5/15kg" },
            { movementId: "box-jump-over", reps: 15, load: "24/20in" },
            { movementId: "t2b", reps: 15 },
          ],
        },
        COOLDOWN_BASIC,
      ],
    },
    {
      day: 7,
      focus: "Repos complet",
      estimatedMinutes: 0,
      blocks: [],
      notes: "OFF total. Sommeil, nutrition, famille.",
    },
  ],
};

export const HYBRID: ProgramTemplate = {
  slug: "hybrid-cf-strength",
  name: "Hybrid · CrossFit × Musculation",
  discipline: "hybrid",
  level: "intermediate",
  daysPerWeek: 6,
  equipment: ["barbell", "rack", "bench", "dumbbell", "kettlebell", "wallball", "pullup_bar", "sled", "rower", "outdoor"],
  summary:
    "Hybride 6j/semaine : 2× push/pull hypertrophie, 1× legs + Hyrox-style, 1× Z2 long, 1× metcon mixte, 1× cooldown adaptatif (walk/run/boxe/swim/rest selon fatigue), 1× OFF.",
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
    "6j/semaine ciblé Hyrox : force jambes/haut, intervalles compromised running, simulations half & full, Zone 2 long, stations sur volume à pace compétition.",
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
    "Programme maison 5-6j/semaine. Bodyweight prioritaire, DB/KB/corde optionnels. Full-body accessible débutant → intermédiaire. Option run extérieur pour l'endurance.",
  weeks: [HOME_WEEK_1],
};

// ============================================================================
// Index + helpers
// ============================================================================

export const programTemplates: ProgramTemplate[] = [CROSSFIT_PURE, HYBRID, HYROX_PURE, AT_HOME];

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
