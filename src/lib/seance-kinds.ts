// Sous-types précis de "Repos" et "Récupération active" choisis dans
// l'accordéon du check-in (voir checkin-form.tsx) — fichier sans dépendance
// serveur, importable aussi bien côté client (formulaire) que serveur
// (dashboard, /session).

export const REPOS_SUBTYPES = [
  "😴 Repos total",
  "🧘 Repos + étirements doux",
  "💤 Repos + sommeil prioritaire",
] as const;

export const RECUP_SUBTYPES = [
  "🚶 Marche",
  "🏊 Natation détente",
  "🚴 Vélo tranquille",
  "🧘 Yoga / mobilité",
  "🤸 Étirements guidés",
] as const;

/** Durée par défaut (minutes) du chrono général de récupération active, selon le type choisi. */
export const RECUP_DEFAULT_MINUTES: Record<string, number> = {
  "🚶 Marche": 30,
  "🏊 Natation détente": 30,
  "🚴 Vélo tranquille": 30,
  "🧘 Yoga / mobilité": 20,
  "🤸 Étirements guidés": 20,
};

export function isReposSubtype(seance: string | null | undefined): boolean {
  return Boolean(seance && (REPOS_SUBTYPES as readonly string[]).includes(seance));
}

export function isRecupSubtype(seance: string | null | undefined): boolean {
  return Boolean(seance && (RECUP_SUBTYPES as readonly string[]).includes(seance));
}

/** Vrai si `seance` est un jour de repos déclaré (repos total OU récupération active) — pas un sport/programme. */
export function isRestLikeSeance(seance: string | null | undefined): boolean {
  return isReposSubtype(seance) || isRecupSubtype(seance);
}
