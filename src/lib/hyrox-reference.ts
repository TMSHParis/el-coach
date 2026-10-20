// Charges et distances officielles Hyrox (règlements 26/27, lus) — référence d'affichage ;
// l'utilisateur saisit ses charges d'entraînement. Charges de sled, châssis compris.

export const HYROX_STATIONS = [
  { name: "SkiErg", distance: "1 000 m" },
  { name: "Sled Push", distance: "50 m (4 × 12,5 m)" },
  { name: "Sled Pull", distance: "50 m" },
  { name: "Burpee Broad Jumps", distance: "80 m" },
  { name: "Rameur", distance: "1 000 m" },
  { name: "Farmers Carry", distance: "200 m" },
  { name: "Sandbag Lunges", distance: "100 m" },
  { name: "Wall Balls", distance: "100 reps" },
] as const;

type Loads = { sledPush: number; sledPull: number; farmers: string; sandbag: number; wallBall: number; target: string };

export const HYROX_LOADS: Record<string, Loads> = {
  "Femmes Open": { sledPush: 102, sledPull: 78, farmers: "2 × 16 kg", sandbag: 10, wallBall: 4, target: "2,70 m" },
  "Femmes Pro": { sledPush: 152, sledPull: 103, farmers: "2 × 24 kg", sandbag: 20, wallBall: 6, target: "2,70 m" },
  "Hommes Open": { sledPush: 152, sledPull: 103, farmers: "2 × 24 kg", sandbag: 20, wallBall: 6, target: "3,00 m" },
  "Hommes Pro": { sledPush: 202, sledPull: 153, farmers: "2 × 32 kg", sandbag: 30, wallBall: 9, target: "3,00 m" },
};

/** « Hommes Open : Sled Push 152 kg, Sled Pull 103 kg, … » — genre inconnu : on affiche les 2 catégories Open/Pro de la catégorie choisie. */
export function loadsLine(genre: string | null | undefined, categorie: string | null | undefined): string {
  const level = /pro/i.test(categorie ?? "") ? "Pro" : "Open";
  const keys = /f/i.test(genre ?? "") ? [`Femmes ${level}`] : /h|m/i.test(genre ?? "") ? [`Hommes ${level}`] : [`Femmes ${level}`, `Hommes ${level}`];
  return keys
    .map((k) => {
      const l = HYROX_LOADS[k];
      return `${k} : Sled Push ${l.sledPush} kg, Sled Pull ${l.sledPull} kg, Farmers ${l.farmers}, Sandbag ${l.sandbag} kg, Wall Ball ${l.wallBall} kg (cible ${l.target})`;
    })
    .join(" · ");
}
