// Séance d'un jour hors ECM (sport libre) ou de repos → mêmes blocs d'affichage
// que les séances ECM (dashboard et /session partagent ce format).

import type { DisplayBlock } from "./session-format";
import type { LegacyNonEcmAdvice, NonEcmAdvice } from "./ecm-engine";
import { isRestDay } from "./ecm-engine";
import { makeT, type Translate } from "./i18n";

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

export function buildAdviceSession(seance: string | null, advice: StoredAdvice, t: Translate = makeT("fr")): AdviceSession {
  const a = normalizeAdvice(advice);
  const repos = isRestDay(seance);
  const titre = repos ? t("srv.adv.recovery") : stripLeadingEmoji(seance ?? t("srv.adv.sessionOfDay"));

  const blocks: DisplayBlock[] = [
    {
      lettre: "1",
      titre: repos ? t("srv.adv.activeRecovery") : t("srv.adv.warmup"),
      badge: repos ? t("srv.adv.optional") : "Not For Time",
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
      titre: repos ? t("srv.adv.watchPoints") : t("srv.adv.injuryPrevention"),
      badge: t("srv.adv.tips"),
      badgeCls: "nft",
      type: "cooldown",
      // Pas de démo vidéo sur un conseil — seul le bloc 1 a des mouvements.
      items: a.prevention.map((p) => ({ name: p, qty: "", movementName: p, noVideo: true })),
    },
    {
      lettre: "3",
      titre: repos ? t("srv.adv.mindsetRecovery") : t("srv.adv.mindset"),
      badge: t("srv.adv.mental"),
      badgeCls: "nft",
      type: "cooldown",
      items: [{ name: a.mindset, qty: "", movementName: a.mindset, noVideo: true }],
    },
  ];

  return { titre, emoji: leadingEmoji(seance), repos, dureeEstimee: a.dureeEstimee, blocks };
}

/** Contenu de récupération par défaut quand aucun conseil n'a été généré pour la journée (partie 4, mission 4). */
export function defaultRecoveryAdvice(t: Translate = makeT("fr")): NonEcmAdvice {
  return {
    dureeEstimee: "20-30 min",
    warmup: [
      { nom: t("srv.adv.def.w1"), duree: "15 min" },
      { nom: t("srv.adv.def.w2"), duree: "2 min" },
      { nom: "Cat-Cow", duree: "10 reps" },
      { nom: t("srv.adv.def.w3"), duree: t("srv.adv.def.d3") },
      { nom: t("srv.adv.def.w4"), duree: "3 min" },
    ],
    prevention: [t("srv.adv.def.p1"), t("srv.adv.def.p2"), t("srv.adv.def.p3")],
    mindset: t("srv.adv.def.mindset"),
  };
}

export const DEFAULT_RECOVERY_ADVICE: NonEcmAdvice = defaultRecoveryAdvice();

/** Blocs de récupération en consultation : conseils du jour s'ils existent, sinon contenu par défaut. */
export function recoveryBlocks(advice: StoredAdvice | null | undefined, t: Translate = makeT("fr")): DisplayBlock[] {
  return buildAdviceSession("😴 Repos total", advice ?? defaultRecoveryAdvice(t), t).blocks;
}

/** Durée indiquée par le contenu (« 20-30 min »). */
export function recoveryDuration(advice: StoredAdvice | null | undefined): string {
  return normalizeAdvice(advice ?? DEFAULT_RECOVERY_ADVICE).dureeEstimee;
}
