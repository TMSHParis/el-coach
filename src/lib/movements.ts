// Base de mouvements — CrossFit (Open / Games), Hyrox (stations officielles
// + complémentaires), accessoires force & home.
// Sert de source unique pour les programmations (voir programming.ts).

export type MovementCategory =
  | "monostructural"
  | "barbell"
  | "dumbbell"
  | "kettlebell"
  | "medball"
  | "gymnastics"
  | "odd_object"
  | "bodyweight"
  | "core"
  | "mobility";

export type MovementSubcategory =
  | "squat"
  | "deadlift"
  | "press"
  | "olympic"
  | "complex"
  | "carry"
  | "lunge"
  | "pulling"
  | "pushing"
  | "handstand"
  | "jump"
  | "burpee"
  | "cardio"
  | "skipping"
  | "sled"
  | "hip_hinge"
  | "rotation"
  | "anti_rotation"
  | "recovery";

export type Equipment =
  | "none"
  | "barbell"
  | "rack"
  | "bench"
  | "dumbbell"
  | "kettlebell"
  | "medball"
  | "wallball"
  | "slamball"
  | "pullup_bar"
  | "rings"
  | "rope"
  | "box"
  | "rower"
  | "ski_erg"
  | "assault_bike"
  | "bike_erg"
  | "sled"
  | "yoke"
  | "atlas_stone"
  | "d_ball"
  | "sandbag"
  | "tire"
  | "ghd"
  | "jump_rope"
  | "resistance_band"
  | "mat"
  | "parallel_bars"
  | "peg_board"
  | "trx"
  | "pool"
  | "outdoor";

export type Level = "beginner" | "intermediate" | "advanced" | "elite";

export type Movement = {
  id: string; // slug unique
  name: string;
  category: MovementCategory;
  subcategory?: MovementSubcategory;
  equipment: Equipment[];
  level: Level;
  tags: string[]; // ex: "explosive", "metcon", "hyrox-station", "home-friendly"
  hyroxStation?: boolean; // station officielle Hyrox
  gamesOnly?: boolean; // réservé compétition avancée
  videoUrl?: string; // démonstration officielle (YouTube)
};

// Extrait l'ID vidéo YouTube depuis une URL (watch, youtu.be, embed, shorts).
export function extractYoutubeId(url: string | undefined): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/,
  );
  return m?.[1] ?? null;
}

// URL d'embed officielle (joue dans l'iframe). Si videoId connu → vidéo précise.
// Sinon, fallback recherche YouTube intégrée (listType=search — déprécié 2020,
// mais souvent encore fonctionnel ; on laisse en best-effort).
export function youtubeEmbedSrc(opts: {
  videoUrl?: string;
  searchQuery: string;
  autoplay?: boolean;
}): string {
  const id = extractYoutubeId(opts.videoUrl);
  const auto = opts.autoplay ? "&autoplay=1" : "";
  if (id) {
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1${auto}`;
  }
  return `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(opts.searchQuery + " demo")}${auto}`;
}

export const movements: Movement[] = [
  // ========================================================================
  // MONOSTRUCTURAL — cardio / mono-articulaire
  // ========================================================================
  { id: "run", name: "Course à pied", category: "monostructural", subcategory: "cardio", equipment: ["outdoor"], level: "beginner", tags: ["zone2", "metcon", "hyrox-core", "home-friendly"] },
  { id: "shuttle-run", name: "Shuttle Run", category: "monostructural", subcategory: "cardio", equipment: ["outdoor"], level: "intermediate", tags: ["speed", "games"] },
  { id: "row", name: "Rameur (Concept2)", category: "monostructural", subcategory: "cardio", equipment: ["rower"], level: "beginner", tags: ["metcon", "hyrox-station"], hyroxStation: true },
  { id: "ski-erg", name: "Ski Erg", category: "monostructural", subcategory: "cardio", equipment: ["ski_erg"], level: "beginner", tags: ["upper", "hyrox-station"], hyroxStation: true },
  { id: "assault-bike", name: "Assault Bike / Echo Bike", category: "monostructural", subcategory: "cardio", equipment: ["assault_bike"], level: "beginner", tags: ["metcon", "full-body"] },
  { id: "bike-erg", name: "Bike Erg", category: "monostructural", subcategory: "cardio", equipment: ["bike_erg"], level: "beginner", tags: ["zone2", "metcon"] },
  { id: "swim", name: "Natation", category: "monostructural", subcategory: "cardio", equipment: ["pool"], level: "intermediate", tags: ["recovery", "games", "cooldown"] },
  { id: "single-under", name: "Single Under", category: "monostructural", subcategory: "skipping", equipment: ["jump_rope"], level: "beginner", tags: ["warmup", "home-friendly"] },
  { id: "double-under", name: "Double Under", category: "monostructural", subcategory: "skipping", equipment: ["jump_rope"], level: "intermediate", tags: ["metcon", "home-friendly"] },
  { id: "triple-under", name: "Triple Under", category: "monostructural", subcategory: "skipping", equipment: ["jump_rope"], level: "elite", tags: ["games"], gamesOnly: true },
  { id: "crossover-du", name: "Double Under Crossover", category: "monostructural", subcategory: "skipping", equipment: ["jump_rope"], level: "advanced", tags: ["games"], gamesOnly: true },
  { id: "ruck", name: "Weighted Vest / Ruck Run", category: "monostructural", subcategory: "cardio", equipment: ["outdoor"], level: "intermediate", tags: ["zone2", "games"] },

  // ========================================================================
  // BARBELL — squat
  // ========================================================================
  { id: "air-squat", name: "Air Squat", category: "bodyweight", subcategory: "squat", equipment: ["none"], level: "beginner", tags: ["warmup", "home-friendly"] },
  { id: "back-squat", name: "Back Squat", category: "barbell", subcategory: "squat", equipment: ["barbell", "rack"], level: "intermediate", tags: ["strength", "powerlift"] },
  { id: "front-squat", name: "Front Squat", category: "barbell", subcategory: "squat", equipment: ["barbell", "rack"], level: "intermediate", tags: ["strength", "oly-prep"] },
  { id: "overhead-squat", name: "Overhead Squat (OHS)", category: "barbell", subcategory: "squat", equipment: ["barbell"], level: "advanced", tags: ["mobility", "oly-prep"] },
  { id: "box-squat", name: "Box Squat", category: "barbell", subcategory: "squat", equipment: ["barbell", "rack", "box"], level: "intermediate", tags: ["strength"] },
  { id: "pause-squat", name: "Pause Squat", category: "barbell", subcategory: "squat", equipment: ["barbell", "rack"], level: "intermediate", tags: ["strength", "tempo"] },

  // ========================================================================
  // BARBELL — deadlift / hinge
  // ========================================================================
  { id: "deadlift", name: "Deadlift", category: "barbell", subcategory: "deadlift", equipment: ["barbell"], level: "intermediate", tags: ["strength", "powerlift"] },
  { id: "sumo-deadlift", name: "Sumo Deadlift", category: "barbell", subcategory: "deadlift", equipment: ["barbell"], level: "intermediate", tags: ["strength"] },
  { id: "rdl", name: "Romanian Deadlift (RDL)", category: "barbell", subcategory: "hip_hinge", equipment: ["barbell"], level: "intermediate", tags: ["hypertrophy", "posterior"] },
  { id: "sdhp", name: "Sumo Deadlift High Pull (SDHP)", category: "barbell", subcategory: "olympic", equipment: ["barbell"], level: "intermediate", tags: ["metcon"] },
  { id: "good-morning", name: "Good Morning", category: "barbell", subcategory: "hip_hinge", equipment: ["barbell"], level: "intermediate", tags: ["posterior", "accessory"] },

  // ========================================================================
  // BARBELL — press
  // ========================================================================
  { id: "strict-press", name: "Strict Press (Shoulder Press)", category: "barbell", subcategory: "press", equipment: ["barbell", "rack"], level: "beginner", tags: ["strength"] },
  { id: "push-press", name: "Push Press", category: "barbell", subcategory: "press", equipment: ["barbell", "rack"], level: "intermediate", tags: ["strength", "metcon"] },
  { id: "push-jerk", name: "Push Jerk", category: "barbell", subcategory: "olympic", equipment: ["barbell", "rack"], level: "advanced", tags: ["explosive"] },
  { id: "split-jerk", name: "Split Jerk", category: "barbell", subcategory: "olympic", equipment: ["barbell", "rack"], level: "advanced", tags: ["explosive", "oly"] },
  { id: "bench-press", name: "Bench Press", category: "barbell", subcategory: "press", equipment: ["barbell", "bench"], level: "beginner", tags: ["strength", "powerlift", "hypertrophy"] },
  { id: "bn-press", name: "Behind the Neck Press", category: "barbell", subcategory: "press", equipment: ["barbell", "rack"], level: "advanced", tags: ["oly-prep"] },

  // ========================================================================
  // BARBELL — olympic
  // ========================================================================
  { id: "clean", name: "Clean (Squat Clean)", category: "barbell", subcategory: "olympic", equipment: ["barbell"], level: "advanced", tags: ["explosive", "oly"] },
  { id: "power-clean", name: "Power Clean", category: "barbell", subcategory: "olympic", equipment: ["barbell"], level: "intermediate", tags: ["explosive", "metcon"] },
  { id: "hang-clean", name: "Hang Clean", category: "barbell", subcategory: "olympic", equipment: ["barbell"], level: "advanced", tags: ["oly"] },
  { id: "hang-power-clean", name: "Hang Power Clean", category: "barbell", subcategory: "olympic", equipment: ["barbell"], level: "intermediate", tags: ["explosive", "metcon"] },
  { id: "snatch", name: "Snatch (Squat Snatch)", category: "barbell", subcategory: "olympic", equipment: ["barbell"], level: "elite", tags: ["oly"] },
  { id: "power-snatch", name: "Power Snatch", category: "barbell", subcategory: "olympic", equipment: ["barbell"], level: "advanced", tags: ["explosive", "metcon"] },
  { id: "hang-snatch", name: "Hang Snatch", category: "barbell", subcategory: "olympic", equipment: ["barbell"], level: "elite", tags: ["oly"] },
  { id: "hang-power-snatch", name: "Hang Power Snatch", category: "barbell", subcategory: "olympic", equipment: ["barbell"], level: "advanced", tags: ["explosive"] },
  { id: "clean-and-jerk", name: "Clean & Jerk", category: "barbell", subcategory: "olympic", equipment: ["barbell"], level: "advanced", tags: ["oly"] },
  { id: "snatch-balance", name: "Snatch Balance", category: "barbell", subcategory: "olympic", equipment: ["barbell", "rack"], level: "advanced", tags: ["oly-prep"] },

  // ========================================================================
  // BARBELL — complexes
  // ========================================================================
  { id: "thruster", name: "Thruster", category: "barbell", subcategory: "complex", equipment: ["barbell"], level: "intermediate", tags: ["metcon", "benchmark"] },
  { id: "g2oh", name: "Ground-to-Overhead", category: "barbell", subcategory: "complex", equipment: ["barbell"], level: "intermediate", tags: ["metcon"] },
  { id: "s2oh", name: "Shoulder-to-Overhead", category: "barbell", subcategory: "complex", equipment: ["barbell", "rack"], level: "intermediate", tags: ["metcon"] },
  { id: "bear-complex", name: "Bear Complex", category: "barbell", subcategory: "complex", equipment: ["barbell"], level: "advanced", tags: ["metcon"] },
  { id: "bb-front-lunge", name: "Front-Rack Barbell Lunge", category: "barbell", subcategory: "lunge", equipment: ["barbell", "rack"], level: "intermediate", tags: ["unilateral"] },
  { id: "bb-walking-lunge", name: "Barbell Walking Lunge", category: "barbell", subcategory: "lunge", equipment: ["barbell"], level: "intermediate", tags: ["unilateral"] },

  // ========================================================================
  // DUMBBELL
  // ========================================================================
  { id: "db-snatch", name: "Dumbbell Snatch (1 bras)", category: "dumbbell", subcategory: "olympic", equipment: ["dumbbell"], level: "intermediate", tags: ["metcon", "home-friendly"] },
  { id: "db-snatch-2arm", name: "Dumbbell Snatch (2 bras)", category: "dumbbell", subcategory: "olympic", equipment: ["dumbbell"], level: "intermediate", tags: ["metcon"] },
  { id: "db-clean", name: "Dumbbell Clean", category: "dumbbell", subcategory: "olympic", equipment: ["dumbbell"], level: "intermediate", tags: ["metcon", "home-friendly"] },
  { id: "db-hang-clean", name: "Dumbbell Hang Clean", category: "dumbbell", subcategory: "olympic", equipment: ["dumbbell"], level: "intermediate", tags: ["metcon"] },
  { id: "db-hang-clean-oh", name: "DB Hang Clean-to-Overhead", category: "dumbbell", subcategory: "complex", equipment: ["dumbbell"], level: "intermediate", tags: ["metcon"] },
  { id: "db-thruster", name: "Dumbbell Thruster", category: "dumbbell", subcategory: "complex", equipment: ["dumbbell"], level: "intermediate", tags: ["metcon", "home-friendly"] },
  { id: "db-front-squat", name: "Dumbbell Front Squat", category: "dumbbell", subcategory: "squat", equipment: ["dumbbell"], level: "beginner", tags: ["home-friendly"] },
  { id: "db-oh-lunge", name: "Dumbbell Overhead Walking Lunge", category: "dumbbell", subcategory: "lunge", equipment: ["dumbbell"], level: "intermediate", tags: ["unilateral", "metcon"] },
  { id: "db-box-step-up", name: "Dumbbell Box Step-up", category: "dumbbell", subcategory: "lunge", equipment: ["dumbbell", "box"], level: "beginner", tags: ["metcon", "hyrox-accessory"] },
  { id: "db-s2oh", name: "Dumbbell Shoulder-to-Overhead", category: "dumbbell", subcategory: "press", equipment: ["dumbbell"], level: "intermediate", tags: ["metcon"] },
  { id: "db-row", name: "Dumbbell Bent-over Row", category: "dumbbell", subcategory: "pulling", equipment: ["dumbbell"], level: "beginner", tags: ["hypertrophy", "home-friendly"] },
  { id: "devils-press", name: "Dumbbell Devil's Press", category: "dumbbell", subcategory: "complex", equipment: ["dumbbell"], level: "advanced", tags: ["metcon", "full-body"] },
  { id: "man-maker", name: "Man Maker", category: "dumbbell", subcategory: "complex", equipment: ["dumbbell"], level: "advanced", tags: ["metcon", "full-body"] },
  { id: "db-cossack", name: "Dumbbell Cossack Squat", category: "dumbbell", subcategory: "lunge", equipment: ["dumbbell"], level: "intermediate", tags: ["mobility", "unilateral"] },
  { id: "db-deadlift", name: "Dumbbell Deadlift", category: "dumbbell", subcategory: "deadlift", equipment: ["dumbbell"], level: "beginner", tags: ["home-friendly"] },
  { id: "db-rdl", name: "Dumbbell RDL", category: "dumbbell", subcategory: "hip_hinge", equipment: ["dumbbell"], level: "beginner", tags: ["posterior", "home-friendly"] },
  { id: "db-bench", name: "Dumbbell Bench Press", category: "dumbbell", subcategory: "pushing", equipment: ["dumbbell", "bench"], level: "beginner", tags: ["hypertrophy"] },
  { id: "db-floor-press", name: "Dumbbell Floor Press", category: "dumbbell", subcategory: "pushing", equipment: ["dumbbell"], level: "beginner", tags: ["home-friendly"] },
  { id: "db-bulgarian", name: "Bulgarian Split Squat", category: "dumbbell", subcategory: "lunge", equipment: ["dumbbell", "bench"], level: "intermediate", tags: ["unilateral", "hypertrophy"] },

  // ========================================================================
  // KETTLEBELL
  // ========================================================================
  { id: "kb-swing-russian", name: "Kettlebell Swing Russe", category: "kettlebell", subcategory: "hip_hinge", equipment: ["kettlebell"], level: "beginner", tags: ["metcon", "explosive", "home-friendly"] },
  { id: "kb-swing-american", name: "Kettlebell Swing Américain", category: "kettlebell", subcategory: "hip_hinge", equipment: ["kettlebell"], level: "intermediate", tags: ["metcon", "explosive"] },
  { id: "kb-clean", name: "Kettlebell Clean", category: "kettlebell", subcategory: "olympic", equipment: ["kettlebell"], level: "intermediate", tags: ["metcon"] },
  { id: "kb-snatch", name: "Kettlebell Snatch", category: "kettlebell", subcategory: "olympic", equipment: ["kettlebell"], level: "advanced", tags: ["metcon"] },
  { id: "kb-goblet-squat", name: "Kettlebell Goblet Squat", category: "kettlebell", subcategory: "squat", equipment: ["kettlebell"], level: "beginner", tags: ["home-friendly"] },
  { id: "kb-box-step-up", name: "KB Box Step-up", category: "kettlebell", subcategory: "lunge", equipment: ["kettlebell", "box"], level: "beginner", tags: ["hyrox-accessory"] },
  { id: "kb-oh-carry", name: "KB Overhead Carry", category: "kettlebell", subcategory: "carry", equipment: ["kettlebell"], level: "intermediate", tags: ["core", "stability"] },
  { id: "kb-farmer-carry", name: "KB Farmer's Carry", category: "kettlebell", subcategory: "carry", equipment: ["kettlebell"], level: "beginner", tags: ["hyrox-station", "grip"], hyroxStation: true },
  { id: "kb-double-carry", name: "KB Double Front-Rack Carry", category: "kettlebell", subcategory: "carry", equipment: ["kettlebell"], level: "intermediate", tags: ["core"] },
  { id: "kb-suitcase-carry", name: "Suitcase Carry", category: "kettlebell", subcategory: "carry", equipment: ["kettlebell"], level: "beginner", tags: ["core", "anti-lateral"] },
  { id: "tgu", name: "Turkish Get-Up", category: "kettlebell", subcategory: "complex", equipment: ["kettlebell"], level: "advanced", tags: ["skill", "stability"] },
  { id: "kb-deadlift", name: "Kettlebell Deadlift", category: "kettlebell", subcategory: "deadlift", equipment: ["kettlebell"], level: "beginner", tags: ["home-friendly"] },
  { id: "kb-press", name: "Kettlebell Press", category: "kettlebell", subcategory: "press", equipment: ["kettlebell"], level: "beginner", tags: ["unilateral", "home-friendly"] },
  { id: "kb-thruster", name: "Kettlebell Thruster", category: "kettlebell", subcategory: "complex", equipment: ["kettlebell"], level: "intermediate", tags: ["metcon"] },
  { id: "kb-row", name: "Kettlebell Row", category: "kettlebell", subcategory: "pulling", equipment: ["kettlebell"], level: "beginner", tags: ["hypertrophy", "home-friendly"] },

  // ========================================================================
  // MEDBALL / WALLBALL / SLAMBALL
  // ========================================================================
  { id: "wall-ball", name: "Wall Ball Shot", category: "medball", subcategory: "complex", equipment: ["wallball"], level: "beginner", tags: ["metcon", "hyrox-station", "benchmark"], hyroxStation: true },
  { id: "med-ball-clean", name: "Med Ball Clean", category: "medball", subcategory: "complex", equipment: ["medball"], level: "beginner", tags: ["metcon", "skill"] },
  { id: "slam-ball", name: "Slam Ball", category: "medball", subcategory: "complex", equipment: ["slamball"], level: "beginner", tags: ["metcon", "home-friendly"] },
  { id: "med-ball-toss", name: "Med Ball Wall Toss (rotation)", category: "medball", subcategory: "rotation", equipment: ["medball"], level: "beginner", tags: ["power", "core"] },

  // ========================================================================
  // GYMNASTIQUE — pulling
  // ========================================================================
  { id: "strict-pullup", name: "Strict Pull-up", category: "gymnastics", subcategory: "pulling", equipment: ["pullup_bar"], level: "intermediate", tags: ["strength"] },
  { id: "kipping-pullup", name: "Kipping Pull-up", category: "gymnastics", subcategory: "pulling", equipment: ["pullup_bar"], level: "intermediate", tags: ["metcon"] },
  { id: "butterfly-pullup", name: "Butterfly Pull-up", category: "gymnastics", subcategory: "pulling", equipment: ["pullup_bar"], level: "advanced", tags: ["metcon", "speed"] },
  { id: "c2b", name: "Chest-to-Bar Pull-up", category: "gymnastics", subcategory: "pulling", equipment: ["pullup_bar"], level: "advanced", tags: ["metcon"] },
  { id: "bar-muscleup", name: "Bar Muscle-up", category: "gymnastics", subcategory: "pulling", equipment: ["pullup_bar"], level: "advanced", tags: ["skill"] },
  { id: "ring-muscleup", name: "Ring Muscle-up", category: "gymnastics", subcategory: "pulling", equipment: ["rings"], level: "advanced", tags: ["skill"] },
  { id: "strict-bar-mu", name: "Strict Bar Muscle-up", category: "gymnastics", subcategory: "pulling", equipment: ["pullup_bar"], level: "elite", tags: ["skill"], gamesOnly: true },
  { id: "strict-ring-mu", name: "Strict Ring Muscle-up", category: "gymnastics", subcategory: "pulling", equipment: ["rings"], level: "elite", tags: ["skill"], gamesOnly: true },
  { id: "ring-row", name: "Ring Row", category: "gymnastics", subcategory: "pulling", equipment: ["rings"], level: "beginner", tags: ["scaling"] },
  { id: "t2b", name: "Toes-to-Bar", category: "gymnastics", subcategory: "pulling", equipment: ["pullup_bar"], level: "intermediate", tags: ["core", "metcon"] },
  { id: "k2e", name: "Knees-to-Elbows", category: "gymnastics", subcategory: "pulling", equipment: ["pullup_bar"], level: "beginner", tags: ["core"] },
  { id: "rope-climb", name: "Rope Climb (pieds)", category: "gymnastics", subcategory: "pulling", equipment: ["rope"], level: "intermediate", tags: ["skill"] },
  { id: "legless-rope", name: "Legless Rope Climb", category: "gymnastics", subcategory: "pulling", equipment: ["rope"], level: "advanced", tags: ["skill"] },
  { id: "ghd-situp", name: "GHD Sit-up", category: "gymnastics", subcategory: "pulling", equipment: ["ghd"], level: "advanced", tags: ["core"] },
  { id: "peg-board", name: "Peg Board Ascent", category: "gymnastics", subcategory: "pulling", equipment: ["peg_board"], level: "elite", tags: ["games"], gamesOnly: true },
  { id: "parallel-bar-walk", name: "Parallel Bar Walk", category: "gymnastics", subcategory: "handstand", equipment: ["parallel_bars"], level: "elite", tags: ["games"], gamesOnly: true },

  // ========================================================================
  // GYMNASTIQUE — pushing
  // ========================================================================
  { id: "pushup", name: "Push-up", category: "bodyweight", subcategory: "pushing", equipment: ["none"], level: "beginner", tags: ["home-friendly", "metcon"] },
  { id: "hrpu", name: "Hand Release Push-up", category: "bodyweight", subcategory: "pushing", equipment: ["none"], level: "beginner", tags: ["metcon", "home-friendly"] },
  { id: "ring-pushup", name: "Ring Push-up", category: "gymnastics", subcategory: "pushing", equipment: ["rings"], level: "intermediate", tags: ["stability"] },
  { id: "ring-dip", name: "Ring Dip", category: "gymnastics", subcategory: "pushing", equipment: ["rings"], level: "advanced", tags: ["strength"] },
  { id: "box-dip", name: "Box Dip", category: "bodyweight", subcategory: "pushing", equipment: ["box"], level: "beginner", tags: ["home-friendly"] },
  { id: "hspu", name: "Kipping HSPU", category: "gymnastics", subcategory: "handstand", equipment: ["none"], level: "advanced", tags: ["skill", "metcon"] },
  { id: "strict-hspu", name: "Strict HSPU", category: "gymnastics", subcategory: "handstand", equipment: ["none"], level: "advanced", tags: ["strength"] },
  { id: "wall-facing-hspu", name: "Wall-Facing HSPU", category: "gymnastics", subcategory: "handstand", equipment: ["none"], level: "elite", tags: ["strict"] },
  { id: "deficit-hspu", name: "Deficit HSPU", category: "gymnastics", subcategory: "handstand", equipment: ["none"], level: "elite", tags: ["games"] },
  { id: "pike-pushup", name: "Pike Push-up", category: "bodyweight", subcategory: "pushing", equipment: ["none"], level: "beginner", tags: ["scaling", "home-friendly"] },

  // ========================================================================
  // GYMNASTIQUE — handstand & balance
  // ========================================================================
  { id: "handstand-hold", name: "Handstand Hold", category: "gymnastics", subcategory: "handstand", equipment: ["none"], level: "intermediate", tags: ["skill"] },
  { id: "handstand-walk", name: "Handstand Walk", category: "gymnastics", subcategory: "handstand", equipment: ["none"], level: "advanced", tags: ["skill", "metcon"] },
  { id: "free-handstand", name: "Freestanding Handstand", category: "gymnastics", subcategory: "handstand", equipment: ["none"], level: "elite", tags: ["skill"] },
  { id: "wall-walk", name: "Wall Walk", category: "gymnastics", subcategory: "handstand", equipment: ["none"], level: "intermediate", tags: ["skill", "metcon"] },
  { id: "bear-crawl", name: "Bear Crawl", category: "bodyweight", subcategory: "handstand", equipment: ["none"], level: "beginner", tags: ["warmup", "home-friendly"] },

  // ========================================================================
  // CORE
  // ========================================================================
  { id: "l-sit", name: "L-sit", category: "core", equipment: ["none"], level: "intermediate", tags: ["skill"] },
  { id: "hollow-hold", name: "Hollow Body Hold", category: "core", equipment: ["mat"], level: "beginner", tags: ["gym-base", "home-friendly"] },
  { id: "hollow-rock", name: "Hollow Rock", category: "core", equipment: ["mat"], level: "beginner", tags: ["home-friendly"] },
  { id: "arch-hold", name: "Superman / Arch Hold", category: "core", equipment: ["mat"], level: "beginner", tags: ["home-friendly"] },
  { id: "plank", name: "Plank", category: "core", equipment: ["mat"], level: "beginner", tags: ["warmup", "home-friendly"] },
  { id: "dead-bug", name: "Dead Bug", category: "core", equipment: ["mat"], level: "beginner", tags: ["activation", "home-friendly"] },
  { id: "pallof-press", name: "Pallof Press", category: "core", subcategory: "anti_rotation", equipment: ["resistance_band"], level: "beginner", tags: ["anti-rotation"] },
  { id: "ab-wheel", name: "Ab Wheel Rollout", category: "core", equipment: ["mat"], level: "advanced", tags: ["strict"] },
  { id: "landmine-rot", name: "Landmine Rotation", category: "core", subcategory: "rotation", equipment: ["barbell"], level: "intermediate", tags: ["power"] },
  { id: "ghd-hip-ext", name: "GHD Hip Extension", category: "core", equipment: ["ghd"], level: "intermediate", tags: ["posterior"] },
  { id: "back-ext", name: "Back Extension", category: "core", equipment: ["ghd"], level: "beginner", tags: ["posterior"] },

  // ========================================================================
  // SAUTS & LUNGES
  // ========================================================================
  { id: "box-jump", name: "Box Jump", category: "bodyweight", subcategory: "jump", equipment: ["box"], level: "beginner", tags: ["metcon"] },
  { id: "box-jump-over", name: "Box Jump Over", category: "bodyweight", subcategory: "jump", equipment: ["box"], level: "intermediate", tags: ["metcon"] },
  { id: "lateral-box-jump", name: "Lateral Box Jump Over", category: "bodyweight", subcategory: "jump", equipment: ["box"], level: "intermediate", tags: ["metcon"] },
  { id: "broad-jump", name: "Broad Jump", category: "bodyweight", subcategory: "jump", equipment: ["none"], level: "beginner", tags: ["power", "home-friendly"] },
  { id: "step-up", name: "Step-up", category: "bodyweight", subcategory: "lunge", equipment: ["box"], level: "beginner", tags: ["home-friendly"] },
  { id: "pistol", name: "Pistol Squat", category: "bodyweight", subcategory: "squat", equipment: ["none"], level: "advanced", tags: ["skill", "home-friendly"] },
  { id: "jump-squat", name: "Jump Squat", category: "bodyweight", subcategory: "jump", equipment: ["none"], level: "beginner", tags: ["power", "home-friendly"] },
  { id: "jumping-lunge", name: "Jumping Lunge", category: "bodyweight", subcategory: "jump", equipment: ["none"], level: "intermediate", tags: ["metcon", "home-friendly"] },
  { id: "walking-lunge", name: "Walking Lunge", category: "bodyweight", subcategory: "lunge", equipment: ["none"], level: "beginner", tags: ["home-friendly"] },
  { id: "reverse-lunge", name: "Reverse Lunge", category: "bodyweight", subcategory: "lunge", equipment: ["none"], level: "beginner", tags: ["home-friendly"] },
  { id: "lateral-lunge", name: "Lateral Lunge / Cossack", category: "bodyweight", subcategory: "lunge", equipment: ["none"], level: "beginner", tags: ["mobility", "home-friendly"] },

  // ========================================================================
  // BURPEES
  // ========================================================================
  { id: "burpee", name: "Burpee", category: "bodyweight", subcategory: "burpee", equipment: ["none"], level: "beginner", tags: ["metcon", "home-friendly"] },
  { id: "bar-facing-burpee", name: "Bar-facing Burpee", category: "bodyweight", subcategory: "burpee", equipment: ["barbell"], level: "intermediate", tags: ["metcon"] },
  { id: "burpee-box-jump-over", name: "Burpee Box Jump Over", category: "bodyweight", subcategory: "burpee", equipment: ["box"], level: "intermediate", tags: ["metcon"] },
  { id: "lateral-burpee-over", name: "Lateral Burpee Over Dumbbell", category: "bodyweight", subcategory: "burpee", equipment: ["dumbbell"], level: "intermediate", tags: ["metcon"] },
  { id: "hr-burpee", name: "Hand Release Burpee", category: "bodyweight", subcategory: "burpee", equipment: ["none"], level: "beginner", tags: ["metcon", "home-friendly"] },
  { id: "burpee-broad-jump", name: "Burpee Broad Jump", category: "bodyweight", subcategory: "burpee", equipment: ["none"], level: "intermediate", tags: ["hyrox-station"], hyroxStation: true },

  // ========================================================================
  // ODD OBJECTS / Hyrox & Strongman
  // ========================================================================
  { id: "sled-push", name: "Sled Push", category: "odd_object", subcategory: "sled", equipment: ["sled"], level: "intermediate", tags: ["hyrox-station", "legs"], hyroxStation: true },
  { id: "sled-pull", name: "Sled Pull", category: "odd_object", subcategory: "sled", equipment: ["sled"], level: "intermediate", tags: ["hyrox-station", "pulling"], hyroxStation: true },
  { id: "prowler-push", name: "Prowler Push", category: "odd_object", subcategory: "sled", equipment: ["sled"], level: "intermediate", tags: ["legs", "accessory"] },
  { id: "tire-flip", name: "Tire Flip", category: "odd_object", equipment: ["tire"], level: "advanced", tags: ["power"] },
  { id: "atlas-stone", name: "Atlas Stone", category: "odd_object", equipment: ["atlas_stone"], level: "advanced", tags: ["games", "strongman"] },
  { id: "dball-shoulder", name: "D-Ball Over Shoulder", category: "odd_object", equipment: ["d_ball"], level: "advanced", tags: ["games"] },
  { id: "dball-clean", name: "D-Ball Clean", category: "odd_object", equipment: ["d_ball"], level: "advanced", tags: ["games"] },
  { id: "dball-carry", name: "D-Ball Bear Hug Carry", category: "odd_object", subcategory: "carry", equipment: ["d_ball"], level: "advanced", tags: ["games"] },
  { id: "sandbag-carry", name: "Sandbag Carry", category: "odd_object", subcategory: "carry", equipment: ["sandbag"], level: "intermediate", tags: ["games"] },
  { id: "sandbag-throw", name: "Sandbag Throw", category: "odd_object", equipment: ["sandbag"], level: "advanced", tags: ["games"] },
  { id: "sandbag-lunge", name: "Sandbag Lunge", category: "odd_object", subcategory: "lunge", equipment: ["sandbag"], level: "intermediate", tags: ["hyrox-station"], hyroxStation: true },
  { id: "yoke-walk", name: "Yoke Walk", category: "odd_object", subcategory: "carry", equipment: ["yoke"], level: "advanced", tags: ["games", "strongman"] },
  { id: "log-cp", name: "Log Clean & Press", category: "odd_object", equipment: ["yoke"], level: "advanced", tags: ["strongman"] },
  { id: "battle-ropes", name: "Battle Ropes", category: "odd_object", equipment: ["rope"], level: "beginner", tags: ["metcon"] },

  // ========================================================================
  // CARRIES (générique)
  // ========================================================================
  { id: "farmers-carry", name: "Farmer's Carry", category: "kettlebell", subcategory: "carry", equipment: ["kettlebell"], level: "beginner", tags: ["hyrox-station", "grip"], hyroxStation: true },
  { id: "db-farmer", name: "Dumbbell Farmer's Carry", category: "dumbbell", subcategory: "carry", equipment: ["dumbbell"], level: "beginner", tags: ["grip", "home-friendly"] },
  { id: "duck-walk", name: "KB Duck Walk", category: "kettlebell", subcategory: "carry", equipment: ["kettlebell"], level: "intermediate", tags: ["legs"] },
  { id: "zercher-carry", name: "Zercher Carry", category: "barbell", subcategory: "carry", equipment: ["barbell"], level: "advanced", tags: ["core", "strongman"] },
  { id: "bear-hug-carry", name: "Bear Hug Carry (sac/stone)", category: "odd_object", subcategory: "carry", equipment: ["sandbag"], level: "intermediate", tags: ["strongman"] },

  // ========================================================================
  // MOBILITY / RECOVERY
  // ========================================================================
  { id: "hip-90-90", name: "Hip 90/90", category: "mobility", subcategory: "recovery", equipment: ["mat"], level: "beginner", tags: ["mobility", "cooldown", "home-friendly"] },
  { id: "pigeon", name: "Pigeon Pose", category: "mobility", subcategory: "recovery", equipment: ["mat"], level: "beginner", tags: ["cooldown", "home-friendly"] },
  { id: "deep-squat-hold", name: "Deep Squat Hold", category: "mobility", subcategory: "recovery", equipment: ["none"], level: "beginner", tags: ["mobility", "home-friendly"] },
  { id: "thoracic-rot", name: "Thoracic Rotations", category: "mobility", subcategory: "rotation", equipment: ["mat"], level: "beginner", tags: ["mobility", "home-friendly"] },
  { id: "banded-shoulder", name: "Banded Shoulder Distraction", category: "mobility", equipment: ["resistance_band"], level: "beginner", tags: ["prehab"] },
  { id: "foam-roll", name: "Foam Rolling", category: "mobility", subcategory: "recovery", equipment: ["mat"], level: "beginner", tags: ["recovery", "cooldown", "home-friendly"] },
  { id: "zone1-walk", name: "Marche Zone 1", category: "monostructural", subcategory: "recovery", equipment: ["outdoor"], level: "beginner", tags: ["cooldown", "recovery"] },
  { id: "shadow-boxing", name: "Shadow Boxing", category: "bodyweight", subcategory: "cardio", equipment: ["none"], level: "beginner", tags: ["cooldown", "home-friendly"] },
  { id: "boxing-bag", name: "Travail au sac (boxe)", category: "bodyweight", subcategory: "cardio", equipment: ["none"], level: "intermediate", tags: ["cooldown", "skill"] },
];

// ============================================================================
// Helpers
// ============================================================================

export function getMovement(id: string): Movement | undefined {
  return movements.find((m) => m.id === id);
}

export function byCategory(category: MovementCategory): Movement[] {
  return movements.filter((m) => m.category === category);
}

export function byTag(tag: string): Movement[] {
  return movements.filter((m) => m.tags.includes(tag));
}

export function byEquipment(equipment: Equipment): Movement[] {
  return movements.filter((m) => m.equipment.includes(equipment));
}

export function hyroxStations(): Movement[] {
  return movements.filter((m) => m.hyroxStation);
}

export function homeFriendly(): Movement[] {
  return movements.filter((m) => m.tags.includes("home-friendly"));
}
