// Ressenti de séance — remplace la note en étoiles (sept. 2026). Module neutre :
// utilisé côté client (compte rendu, historique) comme côté serveur (actions,
// prompts Claude qui adaptent les séances suivantes).

export const SESSION_FEELINGS = [
  { value: "difficile", emoji: "😫", label: "Difficile" },
  { value: "moyen", emoji: "😕", label: "Moyen" },
  { value: "correct", emoji: "😐", label: "Correct" },
  { value: "bon", emoji: "💪", label: "Bon" },
  { value: "excellent", emoji: "🔥", label: "Excellent" },
] as const;

export type SessionFeeling = (typeof SESSION_FEELINGS)[number]["value"];

export function isSessionFeeling(value: string): value is SessionFeeling {
  return SESSION_FEELINGS.some((f) => f.value === value);
}

/** "💪 Bon" — ou null si aucun ressenti n'a été saisi. */
export function feelingBadge(value: string | null | undefined): string | null {
  const found = SESSION_FEELINGS.find((f) => f.value === value);
  return found ? `${found.emoji} ${found.label}` : null;
}

/**
 * Deux séances "difficile" d'affilée → séance B (allégée) recommandée la
 * prochaine fois. `recentFeelings` est ordonné de la plus récente à la plus
 * ancienne ; les séances sans ressenti saisi ne comptent pas comme difficiles.
 */
export function shouldRecommendLightSession(recentFeelings: (string | null)[]): boolean {
  const [last, beforeLast] = recentFeelings;
  return last === "difficile" && beforeLast === "difficile";
}
