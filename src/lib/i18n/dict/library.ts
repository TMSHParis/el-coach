import type { Entries } from "../types";

// Bibliothèque de mouvements (partie 6, mission 2) : libellés des catégories et des types. La clé de catégorie
// est le titre tel qu'écrit dans la liste ; seul son affichage change avec la langue. Les noms de mouvements,
// de WODs et de séances modèles ne sont jamais traduits.
export const library = {
  "lib.cat.POUSSÉE VERTICALE": ["Poussée verticale", "Vertical push", "Empuje vertical"],
  "lib.cat.POUSSÉE HORIZONTALE": ["Poussée horizontale", "Horizontal push", "Empuje horizontal"],
  "lib.cat.TRACTION VERTICALE": ["Traction verticale", "Vertical pull", "Tracción vertical"],
  "lib.cat.TRACTION HORIZONTALE": ["Traction horizontale", "Horizontal pull", "Tracción horizontal"],
  "lib.cat.ÉPAULES ACCESSOIRES": ["Épaules accessoires", "Shoulder accessories", "Hombros accesorios"],
  "lib.cat.TRICEPS / BICEPS ACCESSOIRES": ["Triceps / biceps accessoires", "Triceps / biceps accessories", "Tríceps / bíceps accesorios"],
  "lib.cat.SQUAT": ["Squat", "Squat", "Sentadilla"],
  "lib.cat.HIP HINGE": ["Charnière de hanche", "Hip hinge", "Bisagra de cadera"],
  "lib.cat.FESSIERS / HANCHE": ["Fessiers / hanche", "Glutes / hip", "Glúteos / cadera"],
  "lib.cat.UNILATÉRAL / ÉQUILIBRE": ["Unilatéral / équilibre", "Unilateral / balance", "Unilateral / equilibrio"],
  "lib.cat.MOLLETS / STABILITÉ": ["Mollets / stabilité", "Calves / stability", "Gemelos / estabilidad"],
  "lib.cat.MOUVEMENTS OLYMPIQUES": ["Mouvements olympiques", "Olympic lifts", "Movimientos olímpicos"],
  "lib.cat.FULL BODY COMPOSÉS": ["Corps entier composés", "Compound full body", "Cuerpo completo compuestos"],
  "lib.cat.ANTI-ROTATION": ["Anti-rotation", "Anti-rotation", "Anti-rotación"],
  "lib.cat.FLEXION ABDOMINALE": ["Flexion abdominale", "Abdominal flexion", "Flexión abdominal"],
  "lib.cat.GAINAGE STATIQUE": ["Gainage statique", "Static core", "Core estático"],
  "lib.cat.GAINAGE DYNAMIQUE": ["Gainage dynamique", "Dynamic core", "Core dinámico"],
  "lib.type.musculation": ["Musculation", "Strength training", "Musculación"],
  "lib.type.gainage": ["Gainage", "Core stability", "Core"],
  "lib.type.endurance": ["Endurance", "Endurance", "Resistencia"],
  "lib.type.metcon": ["Metcon", "Metcon", "Metcon"],
  "lib.type.echauffement": ["Échauffement", "Warm-up", "Calentamiento"],
  "lib.type.retour_au_calme": ["Retour au calme", "Cool-down", "Vuelta a la calma"],
  "lib.type.a_definir": ["À définir", "To be defined", "Por definir"],
} as const satisfies Entries;
