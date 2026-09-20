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
