// ============================================================================
// Coaching Adaptatif — données MOCK pour la nouvelle version du Dashboard
// (Section 8 du doc final v2). Tout ce qui se trouve ici sera remplacé par
// des vraies données issues de Supabase + Claude Sonnet 4 à l'Étape 2.5.
// ============================================================================
//
// Le but : permettre de prototyper visuellement le nouveau dashboard sans
// dépendre de la base de données ni de l'API IA. Les valeurs dépendent du
// fatigueScore courant pour donner une cohérence narrative entre les cartes.

import type { Movement } from "./movements";

// ============================================================================
// Score ECM — grade A / B+ / C... + couleur 🟢🟡🔴 + résumé
// ============================================================================

export type EcmState = "green" | "yellow" | "red";

export type EcmScore = {
  state: EcmState;
  letter: string; // "A", "B+", "C", ...
  numeric: number; // 0-100
  headline: string;
  summary: string;
};

/**
 * Convertit le fatigueScore (0-10) en Score ECM affiché sur la home.
 * Mapping : score bas = état VERT (athlète frais), score haut = état ROUGE.
 *
 * Quand le moteur Coaching Adaptatif sera live (Étape 2.5), cette fonction
 * sera remplacée par un appel Claude Sonnet 4 qui croisera profil + check-in.
 */
export function computeEcmScore(fatigueScore: number): EcmScore {
  if (fatigueScore <= 3) {
    return {
      state: "green",
      letter: fatigueScore <= 1 ? "A" : "A-",
      numeric: Math.round(95 - fatigueScore * 3),
      headline: "Tu es prêt à pousser.",
      summary:
        "Énergie haute, jambes légères, mental clair. Séance complète à 100%, charges prescrites.",
    };
  }
  if (fatigueScore <= 6) {
    return {
      state: "yellow",
      letter: fatigueScore <= 4 ? "B+" : fatigueScore <= 5 ? "B" : "B-",
      numeric: Math.round(85 - fatigueScore * 5),
      headline: "Lève le pied, sans couper.",
      summary:
        "Séance allégée recommandée — intensité 80%, volume réduit. Focus technique.",
    };
  }
  return {
    state: "red",
    letter: fatigueScore <= 8 ? "C" : "D",
    numeric: Math.max(20, Math.round(70 - fatigueScore * 5)),
    headline: "Récupération aujourd'hui.",
    summary:
      "Pas de WOD. Mobilité + marche zone 1. Stack récupération + sommeil prioritaire.",
  };
}

// ============================================================================
// Sommeil — 7 dernières nuits (mock)
// ============================================================================

export type SleepNight = {
  /** Étiquette courte type "Lun 12". */
  label: string;
  totalMinutes: number;
  deepMinutes: number;
  remMinutes: number;
  awakeMinutes: number;
};

export type SleepInsight = {
  nights: SleepNight[];
  lastNight: SleepNight;
  trendMinutes: number; // delta vs 7 jours précédents (positif = mieux)
  alerts: string[]; // alertes seuils — profond < 40, REM < 1h30, éveil > 2h
};

const SLEEP_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/**
 * Mock 7 nuits — dérivé du fatigueScore pour rester cohérent avec les autres
 * cartes. Plus le score de fatigue est haut, plus le sommeil est dégradé.
 */
export function buildSleepInsight(fatigueScore: number): SleepInsight {
  const baseTotal = 7 * 60 + 30 - fatigueScore * 12; // 7h30 - fatigue impact
  const baseDeep = 75 - fatigueScore * 4;
  const baseRem = 110 - fatigueScore * 6;

  const nights: SleepNight[] = SLEEP_LABELS.map((label, i) => {
    // Petite variation sinusoïdale pour donner du relief au sparkline.
    const jitter = Math.round(Math.sin(i * 1.3) * 18);
    const totalMinutes = Math.max(330, baseTotal + jitter);
    const deepMinutes = Math.max(20, baseDeep + Math.round(Math.cos(i) * 8));
    const remMinutes = Math.max(40, baseRem + Math.round(Math.sin(i * 0.7) * 12));
    const awakeMinutes = Math.max(0, 15 + Math.round(Math.sin(i * 2) * 10) + fatigueScore);
    return { label, totalMinutes, deepMinutes, remMinutes, awakeMinutes };
  });

  const lastNight = nights[nights.length - 1];
  const first3 = nights.slice(0, 3).reduce((s, n) => s + n.totalMinutes, 0) / 3;
  const last3 = nights.slice(-3).reduce((s, n) => s + n.totalMinutes, 0) / 3;
  const trendMinutes = Math.round(last3 - first3);

  const alerts: string[] = [];
  if (lastNight.deepMinutes < 40) alerts.push("Sommeil profond < 40 min cette nuit");
  if (lastNight.remMinutes < 90) alerts.push("REM < 1h30 cette nuit");
  if (lastNight.awakeMinutes > 120) alerts.push("Réveils > 2h cette nuit");

  return { nights, lastNight, trendMinutes, alerts };
}

// ============================================================================
// Poids — historique 7 jours (mock)
// ============================================================================

export type WeightPoint = { label: string; kg: number };

export type WeightInsight = {
  history: WeightPoint[];
  today: number;
  deltaWeek: number; // delta sur 7 jours en kg
};

export function buildWeightInsight(fatigueScore: number): WeightInsight {
  const base = 78.4;
  // Plus la fatigue est haute, plus on s'écarte vers le bas (déshydratation, stress).
  const history: WeightPoint[] = SLEEP_LABELS.map((label, i) => {
    const drift = Math.sin(i * 0.9) * 0.4 - (fatigueScore > 5 ? 0.3 : 0);
    return { label, kg: Math.round((base + drift) * 10) / 10 };
  });
  const today = history[history.length - 1].kg;
  const deltaWeek = Math.round((today - history[0].kg) * 10) / 10;
  return { history, today, deltaWeek };
}

// ============================================================================
// Stack 4 moments — matin à jeun / midi / pré-séance / soir
// ============================================================================

export type StackItem = {
  name: string;
  dose?: string;
  /** Indique si l'item est actif aujourd'hui (vs pausé par le Coaching Adaptatif). */
  active: boolean;
  note?: string;
};

export type StackMoment = {
  slot: "morning" | "noon" | "pre-workout" | "evening";
  label: string;
  emoji: string;
  items: StackItem[];
};

/**
 * Stack 4 moments — règles de la Section 7 du doc final v2.
 * Active / pause selon le fatigueScore courant.
 */
export function buildStack4Moments(fatigueScore: number): StackMoment[] {
  const isIntense = fatigueScore <= 4;
  const isRecovery = fatigueScore >= 7;
  const stressed = fatigueScore >= 5;

  return [
    {
      slot: "morning",
      label: "Matin à jeun",
      emoji: "🌅",
      items: [
        { name: "Créatine", dose: "5 g", active: isIntense, note: isIntense ? undefined : "Pausée — jour de récup" },
        { name: "Citrulline", dose: "6 g", active: isIntense },
        { name: "Vitamines B complex", dose: "1 cps", active: true },
        { name: "Ginseng", dose: "200 mg", active: fatigueScore >= 5, note: fatigueScore >= 5 ? "Boost énergie ciblé" : undefined },
      ],
    },
    {
      slot: "noon",
      label: "Avec repas midi",
      emoji: "🍽️",
      items: [
        { name: "Oméga 3", dose: "2 g", active: true },
        { name: "Vitamine D3", dose: "2000 UI", active: true },
        { name: "Zinc", dose: "15 mg", active: true },
      ],
    },
    {
      slot: "pre-workout",
      label: "Pré-séance · 1 h avant",
      emoji: "⚡",
      items: isRecovery
        ? [
            {
              name: "Pas de séance prévue",
              active: false,
              note: "État rouge — focus récupération",
            },
          ]
        : [
            { name: "Beta-alanine", dose: "3 g", active: !isRecovery },
            { name: "Café", dose: "100 mg caféine", active: !stressed, note: stressed ? "Caféine réduite — stress modéré" : undefined },
            { name: "Maca", dose: "1500 mg", active: true },
          ],
    },
    {
      slot: "evening",
      label: "Soir · dernier repas",
      emoji: "🌙",
      items: [
        { name: "Magnésium bisglycinate", dose: "400 mg", active: true, note: stressed ? "Dose renforcée" : undefined },
        { name: "Ashwagandha KSM-66", dose: "600 mg", active: stressed, note: stressed ? "Activé — stress élevé" : undefined },
        { name: "Collagène", dose: "10 g", active: true },
      ],
    },
  ];
}

// ============================================================================
// En-cas du jour — mock dérivé du fatigueScore (Couche 3 du Coaching Adaptatif)
// ============================================================================

export type SnackInsight = {
  titre: string;
  contenu: string;
  note: string;
};

export function buildSnack(fatigueScore: number): SnackInsight {
  if (fatigueScore <= 3) {
    return {
      titre: "🥤 Pré-séance",
      contenu: "Lait végétal + banane + 2 dattes",
      note: "Format liquide · Digestion rapide ✅",
    };
  }
  if (fatigueScore <= 6) {
    return {
      titre: "🍫 Collation légère",
      contenu: "Fruit + poignée d'amandes",
      note: "Glycémie stable avant l'effort",
    };
  }
  return {
    titre: "🍵 Focus récupération",
    contenu: "Infusion + oléagineux + carré de chocolat noir",
    note: "Pas d'excitant · priorité au sommeil ce soir",
  };
}

// ============================================================================
// Alertes — blessures / sommeil / récup (mock dérivé du score)
// ============================================================================

export type Alert = {
  level: "info" | "warning" | "critical";
  category: "sleep" | "injury" | "recovery" | "hormonal" | "load";
  message: string;
  hint?: string;
};

export function buildAlerts(fatigueScore: number, sleep: SleepInsight): Alert[] {
  const out: Alert[] = [];

  // Alertes sommeil — issues directement du mock sleep.
  for (const a of sleep.alerts) {
    out.push({
      level: a.startsWith("Sommeil profond") ? "warning" : "info",
      category: "sleep",
      message: a,
      hint: "Magnésium augmenté ce soir · écrans off 21h.",
    });
  }

  if (fatigueScore >= 7) {
    out.push({
      level: "critical",
      category: "load",
      message: "Surcharge détectée — 3e jour consécutif d'état rouge.",
      hint: "Récupération obligatoire aujourd'hui. Pas de WOD.",
    });
  } else if (fatigueScore >= 5) {
    out.push({
      level: "warning",
      category: "recovery",
      message: "Récupération en baisse sur 3 jours.",
      hint: "Séance B recommandée. Stack soir renforcé.",
    });
  }

  // Une alerte blessure mock pour montrer la catégorie (sera désactivée
  // côté UI quand l'utilisateur n'a pas de blessure déclarée).
  if (fatigueScore >= 4) {
    out.push({
      level: "info",
      category: "injury",
      message: "Léger inconfort lombaires signalé hier.",
      hint: "Deadlifts retirés de la séance · core léger uniquement.",
    });
  }

  return out;
}

// ============================================================================
// Séances A / B — placeholder (la vraie génération vient à l'Étape 2.5)
// ============================================================================

export type SessionVariant = "A" | "B";

export type SessionRecommendation = {
  recommended: SessionVariant;
  reason: string;
};

/**
 * Décide quelle variante recommander en fonction du score ECM.
 * Règle Section 8 :
 *   VERT + pas de blessure → A par défaut
 *   JAUNE ou blessure légère → B
 *   ROUGE ou blessure sévère → récupération
 */
export function recommendVariant(ecm: EcmScore): SessionRecommendation {
  if (ecm.state === "green") {
    return { recommended: "A", reason: "État VERT — séance complète à 100%." };
  }
  if (ecm.state === "yellow") {
    return { recommended: "B", reason: "État JAUNE — séance allégée à 80%." };
  }
  return { recommended: "B", reason: "État ROUGE — récupération active." };
}

// ============================================================================
// Boxe Transfer tags — quels mouvements ont un transfert boxe utile
// ============================================================================

const BOXE_TRANSFER_MOVEMENTS = new Set<string>([
  "shadow-boxing",
  "boxing-bag",
  "double-under",
  "single-under",
  "burpee",
  "bar-facing-burpee",
  "hr-burpee",
  "broad-jump",
  "burpee-broad-jump",
  "box-jump-over",
  "hollow-hold",
  "hollow-rock",
  "kb-swing-russian",
  "kb-swing-american",
  "jump-squat",
  "jumping-lunge",
]);

export function hasBoxeTransfer(movement: Movement | undefined): boolean {
  if (!movement) return false;
  return BOXE_TRANSFER_MOVEMENTS.has(movement.id);
}
