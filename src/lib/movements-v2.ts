// Mouvements ajoutés pour les programmes de la partie 2 (octobre 2026) et absents
// de la base d'origine. Pas de lien vidéo tant qu'un coach n'en a pas validé un.

import type { Movement } from "./movements";

const mv = (
  id: string,
  name: string,
  category: Movement["category"],
  equipment: Movement["equipment"],
  level: Movement["level"] = "beginner",
  tags: string[] = [],
  subcategory?: Movement["subcategory"],
): Movement => ({ id, name, category, subcategory, equipment, level, tags });

export const V2_MOVEMENTS: Movement[] = [
  mv("inchworm", "Inchworm", "bodyweight", ["none"], "beginner", ["warmup", "home-friendly"]),
  mv("cat-cow", "Cat-Cow", "mobility", ["mat"], "beginner", ["warmup", "home-friendly"], "recovery"),
  mv("scap-pullup", "Scap Pull-Up", "gymnastics", ["pullup_bar"], "beginner", ["warmup"], "pulling"),
  mv("dead-hang", "Dead Hang", "gymnastics", ["pullup_bar"], "beginner", ["grip"], "pulling"),
  mv("jumping-jacks", "Jumping Jacks", "bodyweight", ["none"], "beginner", ["warmup", "home-friendly"], "jump"),
  mv("arm-circles", "Arm Circles", "mobility", ["none"], "beginner", ["warmup", "home-friendly"], "recovery"),
  mv("high-knees", "High Knees", "bodyweight", ["none"], "beginner", ["cardio", "home-friendly"], "cardio"),
  mv("mountain-climbers", "Mountain Climbers", "bodyweight", ["none"], "beginner", ["cardio", "home-friendly"], "cardio"),
  mv("skater-jump", "Skater Jumps", "bodyweight", ["none"], "beginner", ["cardio", "home-friendly"], "jump"),
  mv("v-up", "V-Up", "core", ["none"], "beginner", ["core", "home-friendly"]),
  mv("negative-pullup", "Traction négative", "gymnastics", ["pullup_bar"], "intermediate", ["progression"], "pulling"),
  mv("pistol-assisted", "Pistol assisté", "bodyweight", ["none"], "intermediate", ["progression", "home-friendly"], "squat"),
  mv("knee-pushup", "Pompe sur genoux", "bodyweight", ["none"], "beginner", ["progression", "home-friendly"], "pushing"),
  mv("decline-pushup", "Pompe déclinée", "bodyweight", ["none"], "intermediate", ["progression", "home-friendly"], "pushing"),
  mv("archer-pushup", "Pompe archer", "bodyweight", ["none"], "advanced", ["progression", "home-friendly"], "pushing"),
  mv("one-arm-pushup", "Pompe une main", "bodyweight", ["none"], "elite", ["progression", "home-friendly"], "pushing"),
  mv("scap-pushup", "Scap Push-Up", "bodyweight", ["none"], "beginner", ["warmup", "home-friendly"], "pushing"),
  mv("hip-openers", "Hip Openers", "mobility", ["none"], "beginner", ["warmup"], "recovery"),
  mv("high-pull", "High Pull", "barbell", ["barbell"], "intermediate", ["olympic-drill"], "olympic"),
  mv("incline-db-press", "Développé incliné haltères", "dumbbell", ["dumbbell", "bench"], "beginner", ["hypertrophy"], "press"),
];
