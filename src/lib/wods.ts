// Bibliothèque de WODs nommés — équivalent « WOD Roulette ».
// Girls (benchmarks classiques), Heroes (mémoriaux militaires),
// Open WODs sélectionnés, autres benchmarks.
// Référencent les movementId existants dans movements.ts.

import type { Block, Exercise } from "./programming";

export type WodCategory = "girls" | "heroes" | "open" | "benchmark";

export type WodTemplate = {
  slug: string;
  name: string;
  category: WodCategory;
  /** Sous-titre / scheme rapide (ex: « 21-15-9 », « 20-min AMRAP »). */
  scheme: string;
  /** Description / objectif du WOD. */
  description: string;
  /** Time cap optionnel (texte). */
  timeCap?: string;
  /** Bloc principal du WOD (utilisable directement comme jour de séance). */
  block: Block;
};

// ============================================================================
// THE GIRLS — benchmarks CrossFit classiques
// ============================================================================

const FRAN: WodTemplate = {
  slug: "fran",
  name: "Fran",
  category: "girls",
  scheme: "21-15-9 · For Time",
  description:
    "Le benchmark le plus iconique de CrossFit. Tout en thrusters et pull-ups. Court, brutal, lung-burner.",
  timeCap: "10min",
  block: {
    name: "Fran",
    type: "wod",
    format: "ForTime",
    duration: "sub 10min",
    exercises: [
      { movementId: "thruster", reps: 21, load: "43/30kg" },
      { movementId: "kipping-pullup", reps: 21 },
      { movementId: "thruster", reps: 15, load: "43/30kg" },
      { movementId: "kipping-pullup", reps: 15 },
      { movementId: "thruster", reps: 9, load: "43/30kg" },
      { movementId: "kipping-pullup", reps: 9 },
    ],
    notes: "Standard sub-5min. Élite sub-3min.",
  },
};

const HELEN: WodTemplate = {
  slug: "helen",
  name: "Helen",
  category: "girls",
  scheme: "3 RFT · 400m + 21 KBS + 12 Pull-ups",
  description:
    "Triplet course/swing/pull. Test classique de capacité aérobie et conditioning.",
  timeCap: "15min",
  block: {
    name: "Helen",
    type: "wod",
    format: "RFT",
    rounds: 3,
    duration: "sub 12min",
    exercises: [
      { movementId: "run", distance: "400m" },
      { movementId: "kb-swing-american", reps: 21, load: "24/16kg" },
      { movementId: "kipping-pullup", reps: 12 },
    ],
  },
};

const GRACE: WodTemplate = {
  slug: "grace",
  name: "Grace",
  category: "girls",
  scheme: "30 Clean & Jerks · For Time",
  description:
    "30 C&J le plus vite possible. Test de capacité haltérophilie sous fatigue.",
  timeCap: "8min",
  block: {
    name: "Grace",
    type: "wod",
    format: "ForTime",
    duration: "sub 7min",
    exercises: [
      { movementId: "clean-and-jerk", reps: 30, load: "60/42.5kg" },
    ],
    notes: "Élite sub-2min.",
  },
};

const ISABEL: WodTemplate = {
  slug: "isabel",
  name: "Isabel",
  category: "girls",
  scheme: "30 Snatches · For Time",
  description: "30 snatches power ou squat. Test technique pur sur barre.",
  timeCap: "8min",
  block: {
    name: "Isabel",
    type: "wod",
    format: "ForTime",
    duration: "sub 6min",
    exercises: [
      { movementId: "power-snatch", reps: 30, load: "60/42.5kg" },
    ],
  },
};

const ANNIE: WodTemplate = {
  slug: "annie",
  name: "Annie",
  category: "girls",
  scheme: "50-40-30-20-10 · DU + Sit-ups",
  description:
    "Cinq descentes en double under et sit-ups. Endurance core et coordination.",
  timeCap: "12min",
  block: {
    name: "Annie",
    type: "wod",
    format: "ForTime",
    duration: "sub 10min",
    exercises: [
      { movementId: "double-under", reps: 50 },
      { movementId: "ghd-situp", reps: 50, notes: "Scale : AbMat sit-ups." },
      { movementId: "double-under", reps: 40 },
      { movementId: "ghd-situp", reps: 40 },
      { movementId: "double-under", reps: 30 },
      { movementId: "ghd-situp", reps: 30 },
      { movementId: "double-under", reps: 20 },
      { movementId: "ghd-situp", reps: 20 },
      { movementId: "double-under", reps: 10 },
      { movementId: "ghd-situp", reps: 10 },
    ],
  },
};

const CINDY: WodTemplate = {
  slug: "cindy",
  name: "Cindy",
  category: "girls",
  scheme: "20-min AMRAP · 5/10/15",
  description:
    "20 minutes de boucle pull-ups / push-ups / air squats. Pur conditioning bodyweight.",
  block: {
    name: "Cindy",
    type: "wod",
    format: "AMRAP",
    duration: "20min",
    exercises: [
      { movementId: "kipping-pullup", reps: 5 },
      { movementId: "pushup", reps: 10 },
      { movementId: "air-squat", reps: 15 },
    ],
    notes: "Objectif : 20+ rounds élite. 15 rounds très solide.",
  },
};

const KAREN: WodTemplate = {
  slug: "karen",
  name: "Karen",
  category: "girls",
  scheme: "150 Wall Balls · For Time",
  description: "150 wall balls d'affilée. Cuisses et épaules en feu.",
  timeCap: "12min",
  block: {
    name: "Karen",
    type: "wod",
    format: "ForTime",
    duration: "sub 10min",
    exercises: [
      { movementId: "wall-ball", reps: 150, load: "9/6kg, target 10/9ft" },
    ],
  },
};

const MARY: WodTemplate = {
  slug: "mary",
  name: "Mary",
  category: "girls",
  scheme: "20-min AMRAP · 5/10/15",
  description:
    "Variante avancée de Cindy : HSPU, pistols, pull-ups. Force gymnastique pure.",
  block: {
    name: "Mary",
    type: "wod",
    format: "AMRAP",
    duration: "20min",
    exercises: [
      { movementId: "hspu", reps: 5, notes: "Scale : pike pushup." },
      { movementId: "pistol", reps: 10, notes: "5 par jambe alterné." },
      { movementId: "kipping-pullup", reps: 15 },
    ],
  },
};

const DIANE: WodTemplate = {
  slug: "diane",
  name: "Diane",
  category: "girls",
  scheme: "21-15-9 · Deadlift + HSPU",
  description: "Couplet pulling lourd + pressing inversé. Posterior + épaules.",
  timeCap: "10min",
  block: {
    name: "Diane",
    type: "wod",
    format: "ForTime",
    duration: "sub 8min",
    exercises: [
      { movementId: "deadlift", reps: 21, load: "102/70kg" },
      { movementId: "hspu", reps: 21 },
      { movementId: "deadlift", reps: 15, load: "102/70kg" },
      { movementId: "hspu", reps: 15 },
      { movementId: "deadlift", reps: 9, load: "102/70kg" },
      { movementId: "hspu", reps: 9 },
    ],
  },
};

const JACKIE: WodTemplate = {
  slug: "jackie",
  name: "Jackie",
  category: "girls",
  scheme: "Triplet · Row + Thruster + Pull-up",
  description: "1000m row, 50 thrusters, 30 pull-ups. Engine + endurance.",
  timeCap: "12min",
  block: {
    name: "Jackie",
    type: "wod",
    format: "ForTime",
    duration: "sub 10min",
    exercises: [
      { movementId: "row", distance: "1000m" },
      { movementId: "thruster", reps: 50, load: "20/15kg, barre vide" },
      { movementId: "kipping-pullup", reps: 30 },
    ],
  },
};

const ELIZABETH: WodTemplate = {
  slug: "elizabeth",
  name: "Elizabeth",
  category: "girls",
  scheme: "21-15-9 · Cleans + Ring Dips",
  description: "Squat clean + ring dips. Force tirage et triceps gymnastique.",
  timeCap: "12min",
  block: {
    name: "Elizabeth",
    type: "wod",
    format: "ForTime",
    duration: "sub 10min",
    exercises: [
      { movementId: "clean", reps: 21, load: "60/42.5kg" },
      { movementId: "ring-dip", reps: 21 },
      { movementId: "clean", reps: 15, load: "60/42.5kg" },
      { movementId: "ring-dip", reps: 15 },
      { movementId: "clean", reps: 9, load: "60/42.5kg" },
      { movementId: "ring-dip", reps: 9 },
    ],
  },
};

const NANCY: WodTemplate = {
  slug: "nancy",
  name: "Nancy",
  category: "girls",
  scheme: "5 RFT · 400m + 15 OHS",
  description:
    "Course + overhead squat. Stabilité épaule sous fatigue cardio.",
  timeCap: "20min",
  block: {
    name: "Nancy",
    type: "wod",
    format: "RFT",
    rounds: 5,
    duration: "sub 18min",
    exercises: [
      { movementId: "run", distance: "400m" },
      { movementId: "overhead-squat", reps: 15, load: "43/30kg" },
    ],
  },
};

const KELLY: WodTemplate = {
  slug: "kelly",
  name: "Kelly",
  category: "girls",
  scheme: "5 RFT · 400m + 30 Box + 30 WB",
  description:
    "Course + box jumps + wall balls. Volume conditioning costaud, jambes ciblées.",
  timeCap: "30min",
  block: {
    name: "Kelly",
    type: "wod",
    format: "RFT",
    rounds: 5,
    duration: "sub 28min",
    exercises: [
      { movementId: "run", distance: "400m" },
      { movementId: "box-jump", reps: 30, load: "24/20in" },
      { movementId: "wall-ball", reps: 30, load: "9/6kg" },
    ],
  },
};

// ============================================================================
// THE HEROES — mémoriaux militaires
// ============================================================================

const MURPH: WodTemplate = {
  slug: "murph",
  name: "Murph",
  category: "heroes",
  scheme: "1mi run · 100/200/300 · 1mi run",
  description:
    "Hommage Lt. Michael Murphy (Navy SEAL, 2005). Le hero WOD le plus fait au monde, traditionnellement Memorial Day. Avec gilet lesté 9/6kg en RX.",
  timeCap: "60min",
  block: {
    name: "Murph",
    type: "wod",
    format: "ForTime",
    duration: "sub 50min",
    exercises: [
      { movementId: "run", distance: "1600m" },
      { movementId: "kipping-pullup", reps: 100 },
      { movementId: "pushup", reps: 200 },
      { movementId: "air-squat", reps: 300 },
      { movementId: "run", distance: "1600m" },
      { movementId: "ruck", notes: "RX : gilet 9/6kg pendant tout le WOD." },
    ],
    notes: "Partition autorisé en 20 rounds de Cindy (5/10/15) entre les runs.",
  },
};

const DT: WodTemplate = {
  slug: "dt",
  name: "DT",
  category: "heroes",
  scheme: "5 RFT · 12/9/6 barbell complex",
  description:
    "Hommage USAF SSgt Timothy P. Davis (2009). Couplet barre lourd, grip et endos cuisinés.",
  timeCap: "20min",
  block: {
    name: "DT",
    type: "wod",
    format: "RFT",
    rounds: 5,
    duration: "sub 15min",
    exercises: [
      { movementId: "deadlift", reps: 12, load: "70/47.5kg" },
      { movementId: "hang-power-clean", reps: 9, load: "70/47.5kg" },
      { movementId: "push-jerk", reps: 6, load: "70/47.5kg" },
    ],
  },
};

const JT: WodTemplate = {
  slug: "jt",
  name: "JT",
  category: "heroes",
  scheme: "21-15-9 · HSPU + Ring Dip + Push-up",
  description:
    "Hommage Petty Officer 1st Class Jeff Taylor (2006). Triplet pressing pur, épaules et triceps.",
  timeCap: "15min",
  block: {
    name: "JT",
    type: "wod",
    format: "ForTime",
    duration: "sub 12min",
    exercises: [
      { movementId: "hspu", reps: 21 },
      { movementId: "ring-dip", reps: 21 },
      { movementId: "pushup", reps: 21 },
      { movementId: "hspu", reps: 15 },
      { movementId: "ring-dip", reps: 15 },
      { movementId: "pushup", reps: 15 },
      { movementId: "hspu", reps: 9 },
      { movementId: "ring-dip", reps: 9 },
      { movementId: "pushup", reps: 9 },
    ],
  },
};

const MICHAEL: WodTemplate = {
  slug: "michael",
  name: "Michael",
  category: "heroes",
  scheme: "3 RFT · 800m + 50 BE + 50 Sit-ups",
  description:
    "Hommage Lt. Michael McGreevy (2005). Run + posterior chain + core. Endurance pure.",
  timeCap: "30min",
  block: {
    name: "Michael",
    type: "wod",
    format: "RFT",
    rounds: 3,
    duration: "sub 25min",
    exercises: [
      { movementId: "run", distance: "800m" },
      { movementId: "back-ext", reps: 50, notes: "Scale : superman holds." },
      { movementId: "ghd-situp", reps: 50, notes: "Scale : AbMat sit-ups." },
    ],
  },
};

const MANION: WodTemplate = {
  slug: "manion",
  name: "Manion",
  category: "heroes",
  scheme: "7 RFT · 400m + 29 Back Squat",
  description:
    "Hommage 1st Lt. Travis Manion (2007). Course + back squat répétés. Jambes en feu.",
  timeCap: "40min",
  block: {
    name: "Manion",
    type: "wod",
    format: "RFT",
    rounds: 7,
    duration: "sub 35min",
    exercises: [
      { movementId: "run", distance: "400m" },
      { movementId: "back-squat", reps: 29, load: "60/40kg" },
    ],
  },
};

const RYAN: WodTemplate = {
  slug: "ryan",
  name: "Ryan",
  category: "heroes",
  scheme: "5 RFT · 7 MU + 21 Burpees",
  description:
    "Hommage Maplewood firefighter Ryan Hummert (2008). Skill gymnastique haut + cardio brutal.",
  timeCap: "20min",
  block: {
    name: "Ryan",
    type: "wod",
    format: "RFT",
    rounds: 5,
    duration: "sub 18min",
    exercises: [
      { movementId: "ring-muscleup", reps: 7, notes: "Scale : 14 C2B + 14 ring dips." },
      { movementId: "burpee", reps: 21 },
    ],
  },
};

const CHAD: WodTemplate = {
  slug: "chad",
  name: "Chad",
  category: "heroes",
  scheme: "1000 Step-ups · with weight",
  description:
    "Hommage Navy SEAL Chad Wilkinson (2018). 1000 step-ups avec sac à dos lesté. Mental + endurance unique.",
  timeCap: "120min",
  block: {
    name: "Chad",
    type: "wod",
    format: "ForTime",
    duration: "sub 90min",
    exercises: [
      {
        movementId: "step-up",
        reps: 1000,
        load: "20/15kg sur le dos · box 20\"",
        notes: "Scale : 500 reps ou sans charge.",
      },
    ],
  },
};

// ============================================================================
// AUTRES BENCHMARKS
// ============================================================================

const FILTHY_FIFTY: WodTemplate = {
  slug: "filthy-fifty",
  name: "Filthy Fifty",
  category: "benchmark",
  scheme: "10 stations · 50 reps chacune",
  description:
    "10 mouvements à la chaîne, 50 reps chacun. Test de polyvalence et de pacing.",
  timeCap: "40min",
  block: {
    name: "Filthy Fifty",
    type: "wod",
    format: "Chipper",
    duration: "sub 35min",
    exercises: [
      { movementId: "box-jump", reps: 50, load: "24/20in" },
      { movementId: "kipping-pullup", reps: 50, notes: "Jumping pull-ups RX." },
      { movementId: "kb-swing-american", reps: 50, load: "16/12kg" },
      { movementId: "walking-lunge", reps: 50, notes: "Steps." },
      { movementId: "k2e", reps: 50 },
      { movementId: "push-press", reps: 50, load: "20/15kg" },
      { movementId: "back-ext", reps: 50 },
      { movementId: "wall-ball", reps: 50, load: "9/6kg" },
      { movementId: "burpee", reps: 50 },
      { movementId: "double-under", reps: 50 },
    ],
  },
};

const FIGHT_GONE_BAD: WodTemplate = {
  slug: "fight-gone-bad",
  name: "Fight Gone Bad",
  category: "benchmark",
  scheme: "3 rounds · 5 stations · 1min chacune",
  description:
    "Format MMA : 5 stations × 1min, max reps, 1min repos entre rounds. Comptez les reps total.",
  timeCap: "17min",
  block: {
    name: "Fight Gone Bad",
    type: "wod",
    format: "Intervals",
    rounds: 3,
    duration: "17min",
    exercises: [
      { movementId: "wall-ball", time: "1min", load: "9/6kg" },
      { movementId: "sdhp", time: "1min", load: "35/25kg" },
      { movementId: "box-jump", time: "1min", load: "20\"" },
      { movementId: "push-press", time: "1min", load: "35/25kg" },
      { movementId: "row", time: "1min", notes: "Score = calories." },
    ],
    notes: "1min de repos entre les rounds. Score total = somme des reps des 3 rounds.",
  },
};

const DEATH_BY_TEN_METERS: WodTemplate = {
  slug: "death-by-10m",
  name: "Death by 10 Meters",
  category: "benchmark",
  scheme: "EMOM jusqu'à l'échec",
  description:
    "Min 1 : 1×10m. Min 2 : 2×10m. Min 3 : 3×10m. Continue jusqu'à ne plus finir dans la minute.",
  timeCap: "20min",
  block: {
    name: "Death by 10 Meters",
    type: "wod",
    format: "EMOM",
    duration: "max",
    exercises: [
      {
        movementId: "shuttle-run",
        notes: "Min N = N allers-retours de 10m. Stop quand tu ne finis pas dans la minute.",
      },
    ],
  },
};

const TABATA_SOMETHING: WodTemplate = {
  slug: "tabata-something-else",
  name: "Tabata Something Else",
  category: "benchmark",
  scheme: "4 × Tabata · 16min",
  description:
    "4 cycles Tabata enchaînés sans repos : pull-ups, push-ups, sit-ups, squats. Score = total reps.",
  timeCap: "16min",
  block: {
    name: "Tabata Something Else",
    type: "wod",
    format: "Tabata",
    rounds: 32,
    duration: "16min",
    exercises: [
      { movementId: "kipping-pullup", notes: "Round 1-8 (4min)." },
      { movementId: "pushup", notes: "Round 9-16 (4min)." },
      { movementId: "ghd-situp", notes: "Round 17-24 (4min)." },
      { movementId: "air-squat", notes: "Round 25-32 (4min)." },
    ],
  },
};

const BARBARA: WodTemplate = {
  slug: "barbara",
  name: "Barbara",
  category: "girls",
  scheme: "5 RFT · 20/30/40/50 + 3min repos",
  description:
    "Cinq rounds bodyweight avec repos imposé. Test de récupération sous volume.",
  timeCap: "45min",
  block: {
    name: "Barbara",
    type: "wod",
    format: "RFT",
    rounds: 5,
    duration: "sub 40min",
    exercises: [
      { movementId: "kipping-pullup", reps: 20 },
      { movementId: "pushup", reps: 30 },
      { movementId: "ghd-situp", reps: 40 },
      { movementId: "air-squat", reps: 50 },
    ],
    notes: "3min repos OBLIGATOIRE entre les rounds. Le repos compte dans le temps total.",
  },
};

const CHELSEA: WodTemplate = {
  slug: "chelsea",
  name: "Chelsea",
  category: "girls",
  scheme: "EMOM 30min · 5/10/15",
  description:
    "Cindy en EMOM. Chaque minute pendant 30 minutes : 5 pull-ups, 10 push-ups, 15 squats.",
  block: {
    name: "Chelsea",
    type: "wod",
    format: "EMOM",
    duration: "30min",
    exercises: [
      { movementId: "kipping-pullup", reps: 5 },
      { movementId: "pushup", reps: 10 },
      { movementId: "air-squat", reps: 15 },
    ],
    notes: "Stop quand tu ne finis plus dans la minute.",
  },
};

const ANGIE: WodTemplate = {
  slug: "angie",
  name: "Angie",
  category: "girls",
  scheme: "100/100/100/100 · For Time",
  description:
    "100 pull-ups, puis 100 push-ups, puis 100 sit-ups, puis 100 squats. Complete chaque mouvement avant le suivant.",
  timeCap: "30min",
  block: {
    name: "Angie",
    type: "wod",
    format: "ForTime",
    duration: "sub 25min",
    exercises: [
      { movementId: "kipping-pullup", reps: 100 },
      { movementId: "pushup", reps: 100 },
      { movementId: "ghd-situp", reps: 100 },
      { movementId: "air-squat", reps: 100 },
    ],
  },
};

const DANIEL: WodTemplate = {
  slug: "daniel",
  name: "Daniel",
  category: "heroes",
  scheme: "Pull-ups + run + thrusters + repeat",
  description:
    "Hommage Sgt. Daniel Crabtree (2006). 50 PU / 400m run / 21 thrusters / 800m run / 21 thrusters / 400m run / 50 PU.",
  timeCap: "30min",
  block: {
    name: "Daniel",
    type: "wod",
    format: "ForTime",
    duration: "sub 25min",
    exercises: [
      { movementId: "kipping-pullup", reps: 50 },
      { movementId: "run", distance: "400m" },
      { movementId: "thruster", reps: 21, load: "60/42.5kg" },
      { movementId: "run", distance: "800m" },
      { movementId: "thruster", reps: 21, load: "60/42.5kg" },
      { movementId: "run", distance: "400m" },
      { movementId: "kipping-pullup", reps: 50 },
    ],
  },
};

// ============================================================================
// Index
// ============================================================================

export const WODS: WodTemplate[] = [
  // Girls
  FRAN, HELEN, GRACE, ISABEL, ANNIE, CINDY, KAREN, MARY, DIANE, JACKIE,
  ELIZABETH, NANCY, KELLY, BARBARA, CHELSEA, ANGIE,
  // Heroes
  MURPH, DT, JT, MICHAEL, MANION, RYAN, CHAD, DANIEL,
  // Benchmarks
  FILTHY_FIFTY, FIGHT_GONE_BAD, DEATH_BY_TEN_METERS, TABATA_SOMETHING,
];

export function getWod(slug: string): WodTemplate | undefined {
  return WODS.find((w) => w.slug === slug);
}

export function wodsByCategory(category: WodCategory): WodTemplate[] {
  return WODS.filter((w) => w.category === category);
}

export const WOD_CATEGORY_LABEL: Record<WodCategory, string> = {
  girls: "The Girls",
  heroes: "Heroes",
  open: "CrossFit Open",
  benchmark: "Benchmarks",
};

// Garde la référence Exercise pour TS
export type { Exercise };
