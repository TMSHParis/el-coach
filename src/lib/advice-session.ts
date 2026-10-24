// Séance d'un jour hors ECM (sport libre) ou de repos → mêmes blocs d'affichage
// que les séances ECM (dashboard et /session partagent ce format).

import type { DisplayBlock } from "./session-format";
import type { LegacyNonEcmAdvice, NonEcmAdvice } from "./ecm-engine";
import { isRestDay } from "./ecm-engine";

export type StoredAdvice = NonEcmAdvice | LegacyNonEcmAdvice;

/** Les lignes générées avant sept. 2026 stockent warmupTips/preventionTips/mindsetMessage. */
export function normalizeAdvice(advice: StoredAdvice): NonEcmAdvice {
  if ("warmup" in advice) return advice;
  return {
    dureeEstimee: "30-45 min",
    warmup: advice.warmupTips.map((nom) => ({ nom })),
    prevention: advice.preventionTips,
    mindset: advice.mindsetMessage,
  };
}

/** "🥊 Boxe" → "Boxe" (libellés du <select> du check-in préfixés d'un emoji). */
export function stripLeadingEmoji(label: string): string {
  return label.replace(/^[^\p{L}\p{N}]+/u, "").trim() || label;
}

/** Emoji du libellé de check-in, réutilisé comme icône de la séance ("🥊 Boxe" → "🥊"). */
export function leadingEmoji(label: string | null): string {
  const match = label?.match(/^[^\p{L}\p{N}\s]+/u);
  return match ? match[0] : "";
}

export type AdviceSession = {
  /** Titre affiché : nom du sport, ou "Récupération" un jour de repos. */
  titre: string;
  emoji: string;
  repos: boolean;
  dureeEstimee: string;
  blocks: DisplayBlock[];
};

export function buildAdviceSession(seance: string | null, advice: StoredAdvice): AdviceSession {
  const a = normalizeAdvice(advice);
  const repos = isRestDay(seance);
  const titre = repos ? "Récupération" : stripLeadingEmoji(seance ?? "Séance du jour");

  const blocks: DisplayBlock[] = [
    {
      lettre: "1",
      titre: repos ? "Récupération active" : "Échauffement",
      badge: repos ? "Facultatif" : "Not For Time",
      badgeCls: "nft",
      // "warmup" / "cooldown" : pas de saisie de résultats sur /session (ni charge, ni score).
      type: repos ? "cooldown" : "warmup",
      items: a.warmup.map((w) => ({
        name: w.nom,
        qty: w.duree ?? "",
        movementName: w.nom,
      })),
    },
    {
      lettre: "2",
      titre: repos ? "Points de vigilance" : "Prévention des blessures",
      badge: "Conseils",
      badgeCls: "nft",
      type: "cooldown",
      // Pas de démo vidéo sur un conseil — seul le bloc 1 a des mouvements.
      items: a.prevention.map((p) => ({ name: p, qty: "", movementName: p, noVideo: true })),
    },
    {
      lettre: "3",
      titre: repos ? "Mindset récupération" : "Mindset",
      badge: "Mental",
      badgeCls: "nft",
      type: "cooldown",
      items: [{ name: a.mindset, qty: "", movementName: a.mindset, noVideo: true }],
    },
  ];

  return { titre, emoji: leadingEmoji(seance), repos, dureeEstimee: a.dureeEstimee, blocks };
}

/** Contenu de récupération par défaut quand aucun conseil n'a été généré pour la journée (partie 4, mission 4). */
export const DEFAULT_RECOVERY_ADVICE: NonEcmAdvice = {
  dureeEstimee: "20-30 min",
  warmup: [
    { nom: "Marche tranquille", duree: "15 min" },
    { nom: "Rotations de hanches", duree: "2 min" },
    { nom: "Cat-Cow", duree: "10 reps" },
    { nom: "Fente basse (mobilité)", duree: "8 reps / côté" },
    { nom: "Respiration diaphragmatique", duree: "3 min" },
  ],
  prevention: [
    "Reste à une intensité où tu peux parler sans t'essouffler.",
    "Hydrate-toi régulièrement, même sans effort.",
    "Évite toute position qui provoque une douleur vive.",
  ],
  mindset: "Aujourd'hui, ton corps se reconstruit. Respire, bouge doucement, n'ajoute rien de plus.",
};

/** Blocs de récupération en consultation : conseils du jour s'ils existent, sinon contenu par défaut. */
export function recoveryBlocks(advice: StoredAdvice | null | undefined): DisplayBlock[] {
  return buildAdviceSession("😴 Repos total", advice ?? DEFAULT_RECOVERY_ADVICE).blocks;
}

/** Durée indiquée par le contenu (« 20-30 min »). */
export function recoveryDuration(advice: StoredAdvice | null | undefined): string {
  return normalizeAdvice(advice ?? DEFAULT_RECOVERY_ADVICE).dureeEstimee;
}
