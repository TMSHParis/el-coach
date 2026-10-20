// Les 5 programmes ECM — structure en 5 blocs (partie 2, section 4, octobre 2026).
// PROPOSITION : séances, volumes et durées préparés par une IA à partir de sources
// publiques, à valider par un coach. Les chiffres « à valider » sont aussi dans
// coach-params.ts et training-themes.ts ; ici on décrit les séances de la semaine type
// au niveau de référence Intermédiaire, en semaine 1 du bloc.
//
// B1 Warm Up (NFT) · B2 cœur de séance · B3 Metcon / accessoire 1 · B4 Finisher /
// accessoire 2 · B5 retour au calme. Import de types uniquement depuis programming.ts
// (pas de cycle d'import à l'exécution).

import type { Block, Day, Exercise, ProgramTemplate } from "./programming";

const ex = (movementId: string, o: Partial<Exercise> = {}): Exercise => ({ movementId, ...o });

const warmup = (minutes: number, exercises: Exercise[], notes?: string): Block => ({
  name: "Warm Up",
  type: "warmup",
  format: "Circuit",
  duration: `${minutes}min`,
  exercises,
  notes,
});

const cooldown = (minutes = 5, exercises?: Exercise[]): Block => ({
  name: "Retour au calme",
  type: "cooldown",
  duration: `${minutes}min`,
  optional: true,
  exercises: exercises ?? [ex("zone1-walk", { time: "2min" }), ex("pigeon", { time: "1min" }), ex("foam-roll", { time: "2min" })],
  notes: "Facultatif : toujours proposé, jamais obligatoire.",
});

/** Complète la semaine à 7 jours : les jours sans séance deviennent des jours de repos. */
function withRestDays(days: Day[], restFocus = "Repos", restNotes = "OFF · marche facile en option."): Day[] {
  return Array.from({ length: 7 }, (_, i) => days.find((d) => d.day === i + 1) ?? { day: i + 1, focus: restFocus, estimatedMinutes: 0, blocks: [], notes: restNotes });
}

// ============================================================================
// 1) CROSSFIT PURE — 5 séances (lun, mar, jeu, ven, sam), mercredi facultatif
// ============================================================================

const CROSSFIT_DAYS: Day[] = [
  {
    day: 1,
    focus: "Squat + cardio",
    estimatedMinutes: 60,
    blocks: [
      warmup(10, [
        ex("run", { distance: "200m", notes: "2 tours : 200 m de course ou 250 m de rameur." }),
        ex("air-squat", { reps: 10 }),
        ex("inchworm", { reps: 10 }),
        ex("good-morning", { reps: 10, load: "BW" }),
        ex("pause-squat", { reps: 5, notes: "Pause 3 s en bas." }),
      ]),
      { name: "Build to Heavy", type: "strength", format: "StraightSets", duration: "20min", exercises: [ex("back-squat", { sets: 5, reps: 5, rest: "2min" })] },
      {
        name: "Metcon", type: "wod", format: "AMRAP", duration: "12min",
        exercises: [ex("thruster", { reps: 5 }), ex("t2b", { reps: 7 }), ex("box-jump", { reps: 9, notes: "Ou Step-Ups." })],
      },
      {
        name: "Finisher", type: "conditioning", format: "ForTime", duration: "8min",
        exercises: [ex("row", { distance: "500m" }), ex("double-under", { reps: 30, notes: "Ou 60 Single-Unders." })],
        notes: "Supprimé si état jaune, semaine de décharge ou thème Force.",
      },
      cooldown(5, [ex("pigeon", { time: "2min", notes: "Étirements quadriceps, fessiers, mollets." }), ex("foam-roll", { time: "3min" })]),
    ],
  },
  {
    day: 2,
    focus: "Gymnastique + force haut modérée + core",
    estimatedMinutes: 60,
    blocks: [
      warmup(10, [
        ex("scap-pullup", { reps: 10 }),
        ex("hollow-rock", { reps: 10 }),
        ex("arch-hold", { time: "20s" }),
        ex("cat-cow", { reps: 10 }),
        ex("planche", { sets: 2, time: "10s" }),
        ex("handstand-hold", { sets: 3, time: "20s", notes: "Ou Pike Hold." }),
      ]),
      {
        name: "Gymnastique + force haut", type: "strength", format: "StraightSets", duration: "20min",
        exercises: [
          ex("strict-pullup", { sets: 4, reps: "3-5", notes: "Ou Chest-to-Bar." }),
          ex("strict-press", { sets: 4, reps: 5, notes: "Charge modérée, jamais au maximum. Facultatif : tu peux le passer." }),
        ],
      },
      {
        name: "EMOM 15", type: "wod", format: "EMOM", duration: "15min", rounds: 5,
        exercises: [ex("kb-swing", { reps: 12, notes: "Minute 1." }), ex("pushup", { reps: 8, notes: "Minute 2." }), ex("sit-up", { reps: 10, notes: "Minute 3." })],
      },
      {
        name: "Finisher core", type: "conditioning", format: "RFT", duration: "8min", rounds: 3,
        exercises: [ex("sit-up", { reps: 20 }), ex("v-up", { reps: 15 }), ex("plank", { time: "30s" })],
        notes: "Supprimé si état jaune.",
      },
      cooldown(),
    ],
  },
  {
    day: 3,
    focus: "Récupération active (facultatif)",
    estimatedMinutes: 35,
    notes:
      "Facultatif, non comptée comme manquée. Version complète (30-40 min) ou minimale (≈25 min : mobilité + cardio facile). Recommandée en état jaune ou rouge ; en décharge, version minimale seulement.",
    blocks: [
      warmup(8, [ex("hip-90-90", { time: "2min" }), ex("thoracic-rot", { time: "2min" }), ex("cat-cow", { reps: 10 }), ex("hip-openers", { time: "2min" })], "Mobilité."),
      {
        name: "Cardio facile continu", type: "endurance", format: "StraightSets", duration: "20min",
        exercises: [ex("row", { time: "20min", notes: "Zone 1-2 : rameur, vélo ou footing. Saisie durée, distance, allure." })],
      },
      {
        name: "Technique légère", type: "skill", format: "StraightSets", duration: "10min",
        exercises: [
          ex("handstand-hold", { sets: 3, time: "20s", notes: "Technique, sans charge ni chrono." }),
          ex("overhead-squat", { sets: 3, reps: 5, load: "bâton" }),
          ex("strict-pullup", { sets: 3, reps: 3, notes: "Très faciles." }),
        ],
      },
      cooldown(5),
    ],
  },
  {
    day: 4,
    focus: "Olympique + cardio",
    estimatedMinutes: 60,
    blocks: [
      warmup(10, [ex("high-pull", { reps: 8, load: "barre vide" }), ex("muscle-snatch", { reps: 8, load: "barre vide" }), ex("overhead-squat", { reps: 8, load: "barre vide" })], "Drills à la barre vide."),
      {
        name: "Build to Heavy", type: "strength", format: "EMOM", duration: "10min",
        exercises: [ex("power-clean", { reps: 2, notes: "Charges modérées à lourdes, jamais à l'échec." }), ex("front-squat", { reps: 1 })],
        notes: "EMOM 10 : 2 Power Cleans + 1 Front Squat (ou Power Snatch).",
      },
      {
        name: "Metcon 21-15-9", type: "wod", format: "ForTime", duration: "cap 12min",
        exercises: [ex("wall-ball", { reps: 21 }), ex("bar-facing-burpee", { reps: 21 }), ex("wall-ball", { reps: 15 }), ex("bar-facing-burpee", { reps: 15 }), ex("wall-ball", { reps: 9 }), ex("bar-facing-burpee", { reps: 9 })],
      },
      {
        name: "Echo Bike", type: "conditioning", format: "Intervals", duration: "5min",
        exercises: [ex("assault-bike", { sets: 5, time: "30s", rest: "30s", notes: "Calories maximum." })],
        notes: "Supprimé si état jaune ou temps court.",
      },
      cooldown(),
    ],
  },
  {
    day: 5,
    focus: "Hinge (option modérée ou lourde)",
    estimatedMinutes: 60,
    notes:
      "Option modérée par défaut. Option lourde (état vert seulement, avertissement : la veille est le jeudi, jour de squat avant ; non proposée en décharge) : Deadlift 5 × 3 Build to Heavy ; B3 AMRAP 12 allégé : 8 Pull-Ups, 10 KB Swings, 12 Goblet Squats. B4 au choix : core (Tabata) ou Renforcement facultatif (DB Bench, rows, curls, triceps, face pulls).",
    blocks: [
      warmup(10, [ex("bird-dog", { reps: 10 }), ex("glute-bridge", { reps: 10 }), ex("rdl", { reps: 10, load: "KB léger" }), ex("good-morning", { reps: 10 })]),
      { name: "Hinge", type: "strength", format: "StraightSets", duration: "20min", exercises: [ex("deadlift", { sets: 4, reps: 5, notes: "Charge confortable.", rest: "2min" })] },
      {
        name: "Metcon", type: "wod", format: "AMRAP", duration: "12min",
        exercises: [ex("hang-power-clean", { reps: 6 }), ex("pull-up", { reps: 8 }), ex("goblet-squat", { reps: 10 })],
      },
      {
        name: "Finisher core", type: "conditioning", format: "Tabata", duration: "4min", rounds: 8,
        exercises: [ex("hollow-hold", { time: "20s", rest: "10s" }), ex("sit-up", { time: "20s", rest: "10s" })],
        notes: "Tabata 8 × 20 s / 10 s en alternant Hollow Hold et Sit-Ups.",
      },
      cooldown(),
    ],
  },
  {
    day: 6,
    focus: "WOD long / Hero",
    estimatedMinutes: 70,
    notes: "Toutes les 2 semaines (S2 et S4), le WOD du Bloc 3 est remplacé par un effort continu : 5 km de course ou 5 000 m de rameur, effort modéré (à confirmer).",
    blocks: [
      warmup(12, [ex("hip-90-90", { time: "2min" }), ex("thoracic-rot", { time: "2min" }), ex("air-squat", { reps: 15 }), ex("scap-pullup", { reps: 10 }), ex("row", { time: "3min" })], "Mobilité complète + activation générale."),
      {
        name: "Skill léger", type: "skill", format: "StraightSets", duration: "15min",
        exercises: [ex("double-under", { sets: 5, reps: "séries courtes", notes: "Au choix : Double-Unders, transition Muscle-Up ou Rope Climb." })],
      },
      {
        name: "WOD long", type: "wod", format: "RFT", duration: "cap 25min", rounds: 5,
        exercises: [ex("run", { distance: "400m" }), ex("kb-swing", { reps: 15 }), ex("pull-up", { reps: 10 }), ex("burpee", { reps: 5 })],
      },
      { name: "Zone 1", type: "conditioning", format: "StraightSets", duration: "5min", optional: true, exercises: [ex("row", { time: "5min", notes: "Facile, Zone 1." })] },
      cooldown(),
    ],
  },
];

export const CROSSFIT_PURE_V2: ProgramTemplate = {
  slug: "crossfit-pure",
  name: "CrossFit Pure",
  discipline: "crossfit",
  level: "intermediate",
  daysPerWeek: 5,
  equipment: ["barbell", "rack", "rower", "assault_bike", "pullup_bar", "rings", "wallball", "kettlebell", "dumbbell", "box"],
  summary:
    "Squat, tirage, press. Arraché, épaulé. Muscle-up, handstand. Metcons qui brûlent. Une programmation conjuguée. Rien n'est laissé au hasard.",
  weeks: [
    {
      weekNumber: 1,
      theme: "S1 volume · S2 +1 série sur B2 · S3 intensité · S4 décharge (≈60 %)",
      days: withRestDays(CROSSFIT_DAYS),
    },
  ],
};

// ============================================================================
// 2) HYBRID ENGINE — 6 jours, dimanche repos
// ============================================================================

const HYBRID_DAYS: Day[] = [
  {
    day: 1,
    focus: "Upper Force",
    estimatedMinutes: 65,
    blocks: [
      warmup(10, [ex("row", { time: "3min", notes: "Facile." }), ex("band-pull-apart", { reps: 15 }), ex("scap-pushup", { reps: 10 }), ex("bench-press", { sets: 2, reps: 8, load: "séries d'approche" })]),
      { name: "Build to Heavy", type: "strength", format: "StraightSets", duration: "20min", exercises: [ex("bench-press", { sets: 5, reps: 5, rest: "2min 30", notes: "Ou Strict Press." })] },
      {
        name: "Accessoires", type: "accessory", format: "StraightSets", duration: "15min",
        exercises: [ex("pull-up", { sets: 4, reps: "8-10", load: "lesté", notes: "Ou Lat Pulldown." }), ex("db-row", { sets: 4, reps: "8-10" })],
      },
      {
        name: "Finisher", type: "conditioning", format: "Intervals", duration: "10min",
        exercises: [ex("row", { sets: 5, time: "2min", rest: "1min", notes: "Allure soutenue, volume modéré, jamais maximal." })],
        notes: "Supprimé si état jaune ou thème Force (protège le squat du mardi).",
      },
      cooldown(),
    ],
  },
  {
    day: 2,
    focus: "Lower Force",
    estimatedMinutes: 65,
    blocks: [
      warmup(10, [ex("assault-bike", { time: "3min" }), ex("goblet-squat", { reps: 10 }), ex("glute-bridge", { reps: 10 }), ex("hip-openers", { time: "1min" })]),
      { name: "Build to Heavy", type: "strength", format: "StraightSets", duration: "20min", exercises: [ex("back-squat", { sets: 5, reps: 5, rest: "2min 30" })] },
      {
        name: "Accessoires", type: "accessory", format: "StraightSets", duration: "15min",
        exercises: [ex("rdl", { sets: 3, reps: "10-12" }), ex("walking-lunge", { sets: 3, reps: "10-12" })],
      },
      {
        name: "Finisher", type: "conditioning", format: "EMOM", duration: "8min",
        exercises: [ex("assault-bike", { reps: 10, notes: "10 cal, repos le reste de la minute." })],
        notes: "Supprimé si état jaune.",
      },
      cooldown(),
    ],
  },
  {
    day: 3,
    focus: "Adaptatif Zone 2",
    estimatedMinutes: 55,
    notes:
      "Pas facultatif. Vert : Zone 2 de 40-45 min (course, vélo ou rameur au choix) + 10 min de mobilité. Jaune : 30 min + mobilité. Rouge : 20 min de mobilité / récupération active. Zone 2 : effort où l'on peut encore parler en phrases courtes (indicatif).",
    blocks: [
      warmup(5, [ex("hip-90-90", { time: "2min" }), ex("thoracic-rot", { time: "2min" })]),
      { name: "Zone 2", type: "endurance", format: "StraightSets", duration: "45min", exercises: [ex("run", { time: "45min", notes: "Course, vélo ou rameur. Saisie durée, distance, allure." })] },
      cooldown(10, [ex("hip-90-90", { time: "3min" }), ex("pigeon", { time: "3min" }), ex("foam-roll", { time: "4min" })]),
    ],
  },
  {
    day: 4,
    focus: "Full Body Functional",
    estimatedMinutes: 60,
    blocks: [
      warmup(10, [ex("hip-90-90", { time: "2min" }), ex("banded-shoulder", { time: "2min" }), ex("air-squat", { sets: 2, reps: 10 }), ex("pushup", { reps: 10 }), ex("burpee", { reps: 5, notes: "Lents." })]),
      {
        name: "Build to Heavy", type: "strength", format: "StraightSets", duration: "15min",
        exercises: [ex("deadlift", { sets: 4, reps: 3, rest: "2min" }), ex("push-press", { sets: 3, reps: 5, rest: "90s" })],
      },
      {
        name: "Metcon", type: "wod", format: "AMRAP", duration: "15min",
        exercises: [ex("kb-swing", { reps: 10 }), ex("burpee", { reps: 8 }), ex("db-thruster", { reps: 6 })],
      },
      {
        name: "Finisher", type: "conditioning", format: "ForTime", duration: "10min",
        exercises: [ex("run", { distance: "1km", notes: "Ou engine." }), ex("wall-ball", { reps: 40 })],
        notes: "Supprimé si état jaune.",
      },
      cooldown(),
    ],
  },
  {
    day: 5,
    focus: "Hypertrophie Push/Pull",
    estimatedMinutes: 60,
    blocks: [
      warmup(10, [ex("row", { time: "3min" }), ex("band-pull-apart", { reps: 15 }), ex("incline-db-press", { sets: 2, reps: 10, load: "séries d'approche" })]),
      {
        name: "Superset principal", type: "strength", format: "Superset", duration: "20min",
        exercises: [ex("incline-db-press", { sets: 4, reps: "8-12" }), ex("machine-row", { sets: 4, reps: "8-12", notes: "Tirage à charge modérée, jamais à l'échec (Deadlift la veille)." })],
      },
      {
        name: "Superset épaules", type: "accessory", format: "Superset", duration: "15min",
        exercises: [ex("lateral-raise", { sets: 3, reps: "10-15" }), ex("face-pull", { sets: 3, reps: "10-15" })],
      },
      {
        name: "Pump", type: "accessory", format: "Superset", duration: "10min",
        exercises: [ex("pushup", { sets: 3, reps: "proche de l'échec" }), ex("inverted-row", { sets: 3, reps: "proche de l'échec" })],
        notes: "3 séries proches de l'échec.",
      },
      cooldown(),
    ],
  },
  {
    day: 6,
    focus: "WOD long (ou sport secondaire)",
    estimatedMinutes: 55,
    notes:
      "Option A : WOD long. Option B : sport secondaire déclaré dans le profil, aucun contenu imposé. Sortie longue facultative (course ou engine) : séance facultative.",
    blocks: [
      warmup(15, [ex("row", { time: "3min" }), ex("hip-90-90", { time: "2min" }), ex("air-squat", { reps: 15 }), ex("scap-pullup", { reps: 10 })]),
      {
        name: "WOD long", type: "wod", format: "RFT", duration: "30-35min", rounds: 4,
        exercises: [ex("run", { distance: "800m" }), ex("kb-swing", { reps: 20 }), ex("box-jump-over", { reps: 15 }), ex("pull-up", { reps: 10 })],
      },
      cooldown(),
    ],
  },
];

export const HYBRID_V2: ProgramTemplate = {
  slug: "hybrid-cf-strength",
  name: "Hybrid Engine",
  discipline: "hybrid",
  level: "intermediate",
  daysPerWeek: 6,
  equipment: ["barbell", "rack", "bench", "dumbbell", "kettlebell", "rower", "assault_bike", "pullup_bar", "wallball", "box"],
  summary: "Trois piliers : hypertrophie, force, endurance (course à pied ou n'importe quel engine).",
  weeks: [
    {
      weekNumber: 1,
      theme: "Cycle de 4 semaines · S4 décharge (≈60-70 % du volume, cardio inchangé en intensité mais plus court)",
      days: withRestDays(HYBRID_DAYS),
    },
  ],
};

// ============================================================================
// 3) HYROX PURE — 6 jours, dimanche repos
// ============================================================================

const HYROX_DAYS: Day[] = [
  {
    day: 1,
    focus: "Force haut du corps",
    estimatedMinutes: 60,
    blocks: [
      warmup(10, [ex("band-pull-apart", { reps: 15 }), ex("scap-pushup", { reps: 10 }), ex("strict-press", { sets: 2, reps: 8, load: "séries d'approche" })]),
      {
        name: "Build to Heavy", type: "strength", format: "StraightSets", duration: "20min",
        exercises: [ex("strict-press", { sets: 4, reps: 6 }), ex("pull-up", { sets: 4, reps: 5, load: "lesté" })],
      },
      {
        name: "Accessoires", type: "accessory", format: "StraightSets", duration: "15min",
        exercises: [ex("db-bench", { sets: 3, reps: 10 }), ex("db-row", { sets: 3, reps: 10, notes: "Un bras." })],
      },
      {
        name: "Finisher", type: "conditioning", format: "Circuit", duration: "10min", rounds: 3,
        exercises: [ex("farmers-carry", { distance: "40m", load: "lourd" }), ex("dead-hang", { time: "30s" })],
        notes: "Facultatif, supprimé si état jaune.",
      },
      cooldown(),
    ],
  },
  {
    day: 2,
    focus: "Intervalles course compromise",
    estimatedMinutes: 60,
    notes: "Seule séance de seuil de la semaine. Saisie : temps du km et de la station.",
    blocks: [
      warmup(10, [ex("run", { time: "5min", notes: "Footing progressif." }), ex("high-knees", { time: "1min", notes: "Éducatifs de course." })]),
      {
        name: "Course compromise", type: "wod", format: "Intervals", duration: "35min", rounds: 5,
        exercises: [
          ex("run", { distance: "1km", notes: "Allure cible, 5 à 6 tours." }),
          ex("wall-ball", { reps: 20, notes: "Station courte au choix : 20 Wall Balls, 25 m Sled Push ou 250 m rameur. Enchaînée sans pause." }),
        ],
        notes: "2 min de repos entre tours.",
      },
      {
        name: "Core", type: "accessory", format: "StraightSets", duration: "8min",
        exercises: [ex("hollow-hold", { sets: 3, time: "30s" }), ex("dead-bug", { sets: 3, reps: 12, notes: "Par côté." })],
      },
      cooldown(),
    ],
  },
  {
    day: 3,
    focus: "Stations en travail",
    estimatedMinutes: 55,
    blocks: [
      warmup(10, [ex("row", { time: "3min", notes: "Facile." }), ex("banded-shoulder", { time: "2min" }), ex("hip-90-90", { time: "2min" })]),
      {
        name: "Stations", type: "wod", format: "Circuit", duration: "35min", rounds: 2,
        exercises: [
          ex("ski-erg", { distance: "500m" }),
          ex("sled-pull", { distance: "25m" }),
          ex("row", { distance: "500m" }),
          ex("farmers-carry", { distance: "100m" }),
        ],
        notes: "Allure confortable, sans chrono compétitif. Repos libre entre blocs. Technique et capacité, pas la vitesse.",
      },
      cooldown(10),
    ],
  },
  {
    day: 4,
    focus: "Force jambes",
    estimatedMinutes: 60,
    blocks: [
      warmup(10, [ex("run", { time: "5min", notes: "Facile." }), ex("hip-90-90", { time: "2min" }), ex("goblet-squat", { reps: 10 })]),
      {
        name: "Build to Heavy", type: "strength", format: "StraightSets", duration: "20min",
        exercises: [ex("back-squat", { sets: 4, reps: 6 }), ex("rdl", { sets: 3, reps: 8 })],
      },
      { name: "Accessoire", type: "accessory", format: "StraightSets", duration: "12min", exercises: [ex("walking-lunge", { sets: 3, reps: 12, load: "lesté", notes: "Ou Step-Ups." })] },
      {
        name: "Finisher", type: "conditioning", format: "StraightSets", duration: "10min",
        exercises: [ex("sled-push", { sets: 4, distance: "50m", load: "charge d'entraînement", rest: "libre" })],
        notes: "Facultatif, supprimé si état jaune.",
      },
      cooldown(),
    ],
  },
  {
    day: 5,
    focus: "Zone 2 longue",
    estimatedMinutes: 65,
    blocks: [
      warmup(8, [ex("hip-90-90", { time: "2min" }), ex("thoracic-rot", { time: "2min" }), ex("run", { time: "3min", notes: "Très facile." })]),
      { name: "Zone 2", type: "endurance", format: "StraightSets", duration: "50min", exercises: [ex("run", { time: "50min", notes: "Course, vélo ou rameur. Saisie durée, distance, allure moyenne." })] },
      cooldown(7, [ex("hip-90-90", { time: "3min" }), ex("pigeon", { time: "2min" }), ex("foam-roll", { time: "2min" })]),
    ],
  },
  {
    day: 6,
    focus: "Simulation half",
    estimatedMinutes: 100,
    notes:
      "Half : 4 × (1 km de course + une station), priorité aux stations de jambes. Full : 8 × (1 km + station) dans l'ordre officiel, réservé à l'état vert. Jaune : half. Rouge : récupération active. Un résultat par segment, total additionné.",
    blocks: [
      warmup(12, [ex("run", { time: "5min", notes: "Facile." }), ex("hip-90-90", { time: "2min" }), ex("air-squat", { reps: 15 }), ex("banded-shoulder", { time: "2min" })]),
      {
        name: "Simulation half-Hyrox", type: "wod", format: "Simulation", duration: "70min", rounds: 4,
        exercises: [
          ex("run", { distance: "1km" }),
          ex("sandbag-lunges", { distance: "100m" }),
          ex("run", { distance: "1km" }),
          ex("wall-ball", { reps: 100 }),
          ex("run", { distance: "1km" }),
          ex("sled-push", { distance: "50m" }),
          ex("run", { distance: "1km" }),
          ex("burpee-broad-jump", { distance: "80m" }),
        ],
      },
      cooldown(10),
    ],
  },
];

export const HYROX_PURE_V2: ProgramTemplate = {
  slug: "hyrox-pure",
  name: "Hyrox Pure",
  discipline: "hyrox",
  level: "intermediate",
  daysPerWeek: 6,
  equipment: ["barbell", "rack", "dumbbell", "rower", "ski_erg", "sled", "sandbag", "wallball", "pullup_bar"],
  summary: "Stations, course, compétition. Une seule séance de seuil par semaine, la Zone 2 forme la base.",
  weeks: [
    {
      weekNumber: 1,
      theme: "S1-S2 progression · S3 pic · S4 décharge",
      days: withRestDays(HYROX_DAYS),
    },
  ],
};

// ============================================================================
// 4) VOLUME BLOCK HYPERTROPHY — 5 jours, week-end libre, tout en Not For Time
// ============================================================================

const vbWarmup = (): Block =>
  warmup(8, [ex("assault-bike", { time: "3min", notes: "Cardio léger." }), ex("hip-90-90", { time: "1min", notes: "Mobilité." }), ex("air-squat", { sets: 2, reps: 8, notes: "2 séries d'approche." })]);
const vbCooldown = (): Block => cooldown(5, [ex("pigeon", { time: "2min" }), ex("thoracic-rot", { time: "1min" }), ex("foam-roll", { time: "2min" })]);
const sets = (movementId: string, s: number, reps: string, o: Partial<Exercise> = {}): Exercise => ex(movementId, { sets: s, reps, ...o });
const vbBlock = (name: string, type: Block["type"], exercises: Exercise[], format: Block["format"] = "StraightSets"): Block => ({
  name,
  type,
  format,
  exercises,
});

const VOLUME_BLOCK_DAYS: Day[] = [
  {
    day: 1,
    focus: "Upper",
    estimatedMinutes: 60,
    blocks: [
      vbWarmup(),
      vbBlock("Mouvement principal", "strength", [sets("bench-press", 4, "6-8", { rest: "2min" })]),
      vbBlock("Accessoire 1", "accessory", [sets("barbell-row", 4, "8-10", { rest: "90s" }), sets("db-shoulder-press", 3, "8-10", { rest: "90s" })]),
      vbBlock("Accessoire 2", "accessory", [sets("lateral-raise", 3, "12"), sets("db-curl", 3, "12", { notes: "Superset avec Lateral Raises." }), sets("tricep-pushdown", 3, "12")], "Superset"),
      vbCooldown(),
    ],
  },
  {
    day: 2,
    focus: "Lower",
    estimatedMinutes: 60,
    blocks: [
      vbWarmup(),
      vbBlock("Mouvement principal", "strength", [sets("back-squat", 4, "6-8", { rest: "2min" })]),
      vbBlock("Accessoire 1", "accessory", [sets("rdl", 4, "8-10", { rest: "90s" }), sets("leg-press", 3, "10-12", { rest: "90s" })]),
      vbBlock("Accessoire 2", "accessory", [sets("leg-curl-couche", 3, "12"), sets("calf-raise-debout", 4, "15")]),
      vbCooldown(),
    ],
  },
  {
    day: 3,
    focus: "Push",
    estimatedMinutes: 60,
    blocks: [
      vbWarmup(),
      vbBlock("Mouvement principal", "strength", [sets("incline-db-press", 4, "8-10", { rest: "2min" })]),
      vbBlock("Accessoire 1", "accessory", [sets("db-shoulder-press", 3, "8-10", { notes: "Machine ou haltères." }), sets("dips", 3, "8-12")]),
      vbBlock("Accessoire 2", "accessory", [sets("lateral-raise", 4, "12-15"), sets("overhead-tricep-extension", 3, "12"), sets("cable-fly", 3, "12-15")]),
      vbCooldown(),
    ],
  },
  {
    day: 4,
    focus: "Pull",
    estimatedMinutes: 60,
    blocks: [
      vbWarmup(),
      vbBlock("Mouvement principal", "strength", [sets("pull-up", 4, "6-10", { rest: "2min", notes: "Ou Lat Pulldown." })]),
      vbBlock("Accessoire 1", "accessory", [sets("machine-row", 4, "8-10", { notes: "Seated Row." }), sets("db-row", 3, "10", { notes: "Un bras." })]),
      vbBlock("Accessoire 2", "accessory", [sets("face-pull", 3, "15", { notes: "Arrière d'épaule (≈ 3 séries par semaine ; un 2e mouvement si priorité Esthétique)." }), sets("db-curl", 3, "10-12"), sets("hammer-curl", 3, "12")]),
      vbCooldown(),
    ],
  },
  {
    day: 5,
    focus: "Legs",
    estimatedMinutes: 60,
    blocks: [
      vbWarmup(),
      vbBlock("Mouvement principal", "strength", [sets("front-squat", 4, "8-10", { rest: "2min", notes: "Ou Hack Squat." })]),
      vbBlock("Accessoire 1", "accessory", [sets("db-bulgarian", 3, "10", { notes: "Par jambe." }), sets("hip-thrust", 4, "8-10")]),
      vbBlock("Accessoire 2", "accessory", [sets("leg-extension", 3, "12-15"), sets("leg-curl-couche", 3, "12"), sets("calf-raise-debout", 4, "15")]),
      vbCooldown(),
    ],
  },
];

export const VOLUME_BLOCK_V2: ProgramTemplate = {
  slug: "volume-block-hypertrophy",
  name: "Volume Block · Hypertrophy",
  discipline: "hypertrophy",
  level: "intermediate",
  daysPerWeek: 5,
  equipment: ["barbell", "rack", "bench", "dumbbell", "machine", "cable", "pullup_bar"],
  summary: "Split Upper / Lower / Push / Pull / Legs. Tout en Not For Time : seuls les repos entre séries sont décomptés.",
  weeks: [
    {
      weekNumber: 1,
      theme: "Filière Hypertrophie par défaut · cible ≈ 12 à 16 séries par groupe et par semaine (à recompter par un coach)",
      days: withRestDays(VOLUME_BLOCK_DAYS, "Week-end libre", "Week-end libre : repos, ou le sport de ton choix."),
    },
  ],
};

// ============================================================================
// 5) AT HOME — 6 séances (lun à sam), calisthénie intégrée
// ============================================================================

const homeWarmup = (): Block =>
  warmup(8, [ex("jumping-jacks", { time: "1min" }), ex("arm-circles", { time: "1min" }), ex("air-squat", { reps: 10 }), ex("inchworm", { reps: 8 }), ex("cat-cow", { reps: 10 })]);

const AT_HOME_DAYS: Day[] = [
  {
    day: 1,
    focus: "Full Body Force A",
    estimatedMinutes: 45,
    blocks: [
      homeWarmup(),
      vbBlock("Poussée + jambes", "strength", [sets("pushup", 4, "8-12", { rest: "90s", notes: "Chaîne : genoux → pompes → déclinées → archer → une main." }), sets("db-bulgarian", 4, "8-10", { rest: "90s", notes: "Chaîne : squat → bulgare → pistol assisté → pistol." })]),
      vbBlock("Tirage", "accessory", [sets("inverted-row", 3, "8-12", { notes: "Élastique ou sac si pas de barre." })]),
      { name: "Finisher", type: "conditioning", format: "AMRAP", duration: "5min", optional: true, exercises: [ex("burpee", { reps: 5 }), ex("mountain-climbers", { reps: 10, notes: "Par jambe." }), ex("air-squat", { reps: 15 })], notes: "Facultatif." },
      cooldown(),
    ],
  },
  {
    day: 2,
    focus: "Cardio poids du corps",
    estimatedMinutes: 40,
    notes: "Même intensité que le vendredi, mouvements variés.",
    blocks: [
      homeWarmup(),
      {
        name: "Intervalles 40/20", type: "wod", format: "Intervals", duration: "20min", rounds: 5,
        exercises: [ex("burpee", { time: "40s", rest: "20s" }), ex("high-knees", { time: "40s", rest: "20s" }), ex("jump-squat", { time: "40s", rest: "20s" }), ex("skater-jump", { time: "40s", rest: "20s" })],
        notes: "5 tours de 40 s d'effort / 20 s de repos sur 4 mouvements, 90 s de repos entre tours.",
      },
      { name: "Tabata", type: "conditioning", format: "Tabata", duration: "4min", rounds: 8, exercises: [ex("mountain-climbers", { time: "20s", rest: "10s" })] },
      cooldown(),
    ],
  },
  {
    day: 3,
    focus: "Core & Skills",
    estimatedMinutes: 35,
    blocks: [
      warmup(8, [ex("cat-cow", { reps: 10 }), ex("hip-90-90", { time: "2min" }), ex("hip-openers", { time: "2min" }), ex("bird-dog", { reps: 10 })], "Mobilité bassin et dos."),
      vbBlock("Gainage", "accessory", [ex("plank", { sets: 3, time: "45s" }), ex("side-plank", { sets: 3, time: "30s", notes: "Par côté." }), ex("hollow-hold", { sets: 3, time: "30s" })]),
      vbBlock("Skill", "skill", [ex("handstand-hold", { sets: 5, time: "20s", notes: "Poirier contre le mur." }), ex("l-sit", { sets: 3, time: "15s" })]),
      cooldown(),
    ],
  },
  {
    day: 4,
    focus: "Full Body Force B",
    estimatedMinutes: 45,
    blocks: [
      homeWarmup(),
      vbBlock("Tirage + jambes", "strength", [sets("inverted-row", 4, "6-10", { rest: "90s", notes: "Chaîne : rowing renversé → tractions négatives → tractions → lestées → archer." }), sets("pistol-assisted", 4, "5-8", { rest: "90s", notes: "Ou glute bridge une jambe." })]),
      vbBlock("Accessoires", "accessory", [sets("pike-pushup", 3, "8-10"), sets("inverted-row", 3, "8-12")]),
      { name: "Finisher", type: "conditioning", format: "AMRAP", duration: "5min", optional: true, exercises: [ex("burpee", { reps: 8 }), ex("air-squat", { reps: 12 }), ex("sit-up", { reps: 10 })], notes: "Facultatif." },
      cooldown(),
    ],
  },
  {
    day: 5,
    focus: "Cardio poids du corps",
    estimatedMinutes: 40,
    notes: "Même intensité que le mardi, mouvements en rotation.",
    blocks: [
      homeWarmup(),
      {
        name: "Intervalles 40/20", type: "wod", format: "Intervals", duration: "20min", rounds: 5,
        exercises: [ex("jumping-lunge", { time: "40s", rest: "20s" }), ex("bear-crawl", { time: "40s", rest: "20s" }), ex("shuttle-run", { time: "40s", rest: "20s" }), ex("burpee", { time: "40s", rest: "20s" })],
        notes: "5 tours de 40 s d'effort / 20 s de repos, 90 s de repos entre tours.",
      },
      { name: "Tabata", type: "conditioning", format: "Tabata", duration: "4min", rounds: 8, exercises: [ex("mountain-climbers", { time: "20s", rest: "10s" })] },
      cooldown(),
    ],
  },
  {
    day: 6,
    focus: "Run ou récupération active",
    estimatedMinutes: 40,
    notes: "Vert : footing continu 30-40 min facile. Jaune : 20-25 min. Rouge : marche + mobilité.",
    blocks: [
      warmup(5, [ex("hip-90-90", { time: "2min" }), ex("arm-circles", { time: "1min" }), ex("high-knees", { time: "1min" })]),
      { name: "Footing facile", type: "endurance", format: "StraightSets", duration: "35min", exercises: [ex("run", { time: "35min", notes: "Facile. Saisie distance, temps, allure." })] },
      cooldown(),
    ],
  },
];

export const AT_HOME_V2: ProgramTemplate = {
  slug: "at-home",
  name: "At Home",
  discipline: "home",
  level: "intermediate",
  daysPerWeek: 6,
  equipment: ["none", "resistance_band", "dumbbell", "pullup_bar"],
  summary: "Calisthénie intégrée, trois niveaux de matériel : Aucun, Basique, Étendu.",
  weeks: [
    {
      weekNumber: 1,
      theme: "Pas de thème : Équilibré · S4 décharge, pas de montée de niveau",
      days: withRestDays(AT_HOME_DAYS),
    },
  ],
};

export const V2_TEMPLATES: ProgramTemplate[] = [CROSSFIT_PURE_V2, HYBRID_V2, HYROX_PURE_V2, VOLUME_BLOCK_V2, AT_HOME_V2];
