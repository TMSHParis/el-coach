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
import { DICT } from "./i18n/dict";
import { LANGS, makeT, translate, type DictKey, type Lang, type Translate } from "./i18n";

// Les builders ci-dessous produisent du texte via `t` (français par défaut : le texte est stocké
// tel quel en base à la création du check-in). À l'affichage, `localizeStored` retrouve ces
// phrases françaises et les traduit dans la langue active.
let frIndex: Map<string, DictKey> | null = null;
function indexFr(): Map<string, DictKey> {
  if (!frIndex) {
    frIndex = new Map();
    for (const [k, v] of Object.entries(DICT) as [string, readonly string[]][]) {
      if (k.startsWith("dash.mock.") && !frIndex.has(v[0])) frIndex.set(v[0], k as DictKey);
    }
  }
  return frIndex;
}

/** Traduit une phrase issue des builders (ou stockée en français en base) ; inconnue : renvoyée telle quelle. */
export function localizeStored(lang: Lang, text: string): string {
  if (lang === "fr" || !text) return text;
  const idx = indexFr();
  const key = idx.get(text);
  if (key) return translate(lang, key);
  // « Lun 12 » : abréviation de jour suivie d'un complément.
  const m = text.match(/^(\S+)(\s.*)$/);
  const dayKey = m ? idx.get(m[1]) : undefined;
  if (m && dayKey && dayKey.startsWith("dash.mock.d.")) return translate(lang, dayKey) + m[2];
  return text;
}

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
export function computeEcmScore(fatigueScore: number, t: Translate = makeT("fr")): EcmScore {
  if (fatigueScore <= 3) {
    return {
      state: "green",
      letter: fatigueScore <= 1 ? "A" : "A-",
      numeric: Math.round(95 - fatigueScore * 3),
      headline: t("dash.mock.ecm.green.headline"),
      summary: t("dash.mock.ecm.green.summary"),
    };
  }
  if (fatigueScore <= 6) {
    return {
      state: "yellow",
      letter: fatigueScore <= 4 ? "B+" : fatigueScore <= 5 ? "B" : "B-",
      numeric: Math.round(85 - fatigueScore * 5),
      headline: t("dash.mock.ecm.yellow.headline"),
      summary: t("dash.mock.ecm.yellow.summary"),
    };
  }
  return {
    state: "red",
    letter: fatigueScore <= 8 ? "C" : "D",
    numeric: Math.max(20, Math.round(70 - fatigueScore * 5)),
    headline: t("dash.mock.ecm.red.headline"),
    summary: t("dash.mock.ecm.red.summary"),
  };
}

// ============================================================================
// Sommeil — 7 dernières nuits (mock)
// ============================================================================

export type SleepNight = {
  /** Étiquette courte type "Lun 12". */
  label: string;
  totalMinutes: number;
  /** Sommeil lent — valeur indépendante (check-in), pas une soustraction des autres phases. */
  lightMinutes: number;
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

const SLEEP_LABEL_KEYS = [
  "dash.mock.d.Lun",
  "dash.mock.d.Mar",
  "dash.mock.d.Mer",
  "dash.mock.d.Jeu",
  "dash.mock.d.Ven",
  "dash.mock.d.Sam",
  "dash.mock.d.Dim",
] as const;

/**
 * Mock 7 nuits — dérivé du fatigueScore pour rester cohérent avec les autres
 * cartes. Plus le score de fatigue est haut, plus le sommeil est dégradé.
 */
export function buildSleepInsight(fatigueScore: number, t: Translate = makeT("fr")): SleepInsight {
  const baseTotal = 7 * 60 + 30 - fatigueScore * 12; // 7h30 - fatigue impact
  const baseDeep = 75 - fatigueScore * 4;
  const baseRem = 110 - fatigueScore * 6;

  const nights: SleepNight[] = SLEEP_LABEL_KEYS.map((labelKey, i) => {
    const label = t(labelKey);
    // Petite variation sinusoïdale pour donner du relief au sparkline.
    const jitter = Math.round(Math.sin(i * 1.3) * 18);
    const totalMinutes = Math.max(330, baseTotal + jitter);
    const deepMinutes = Math.max(20, baseDeep + Math.round(Math.cos(i) * 8));
    const remMinutes = Math.max(40, baseRem + Math.round(Math.sin(i * 0.7) * 12));
    const awakeMinutes = Math.max(0, 15 + Math.round(Math.sin(i * 2) * 10) + fatigueScore);
    const lightMinutes = Math.max(60, Math.round(totalMinutes * 0.59));
    return { label, totalMinutes, lightMinutes, deepMinutes, remMinutes, awakeMinutes };
  });

  const lastNight = nights[nights.length - 1];
  const first3 = nights.slice(0, 3).reduce((s, n) => s + n.totalMinutes, 0) / 3;
  const last3 = nights.slice(-3).reduce((s, n) => s + n.totalMinutes, 0) / 3;
  const trendMinutes = Math.round(last3 - first3);

  const alerts: string[] = [];
  const deepLow = lastNight.deepMinutes < 40;
  const remLow = lastNight.remMinutes < 90;
  if (deepLow && remLow) alerts.push(t("dash.mock.sleepDeepRem"));
  else if (deepLow) alerts.push(t("dash.mock.sleepDeep"));
  else if (remLow) alerts.push(t("dash.mock.sleepRem"));
  if (lastNight.awakeMinutes > 120) alerts.push(t("dash.mock.sleepAwake"));

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

export function buildWeightInsight(fatigueScore: number, t: Translate = makeT("fr")): WeightInsight {
  const base = 78.4;
  // Plus la fatigue est haute, plus on s'écarte vers le bas (déshydratation, stress).
  const history: WeightPoint[] = SLEEP_LABEL_KEYS.map((labelKey, i) => {
    const label = t(labelKey);
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
export function buildStack4Moments(fatigueScore: number, t: Translate = makeT("fr")): StackMoment[] {
  const isIntense = fatigueScore <= 4;
  const isRecovery = fatigueScore >= 7;
  const stressed = fatigueScore >= 5;

  return [
    {
      slot: "morning",
      label: t("dash.mock.slot.morning"),
      emoji: "🌅",
      items: [
        { name: t("dash.mock.supp.creatine"), dose: "5 g", active: isIntense, note: isIntense ? undefined : t("dash.mock.note.pausedRecovery") },
        { name: t("dash.mock.supp.citrulline"), dose: "6 g", active: isIntense },
        { name: t("dash.mock.supp.bComplex"), dose: t("dash.mock.dose.cps"), active: true },
        { name: t("dash.mock.supp.ginseng"), dose: "200 mg", active: fatigueScore >= 5, note: fatigueScore >= 5 ? t("dash.mock.note.energyBoost") : undefined },
      ],
    },
    {
      slot: "noon",
      label: t("dash.mock.slot.noon"),
      emoji: "🍽️",
      items: [
        { name: t("dash.mock.supp.omega3"), dose: "2 g", active: true },
        { name: t("dash.mock.supp.d3"), dose: t("dash.mock.dose.ui"), active: true },
        { name: t("dash.mock.supp.zinc"), dose: "15 mg", active: true },
      ],
    },
    {
      slot: "pre-workout",
      label: t("dash.mock.slot.pre"),
      emoji: "⚡",
      items: isRecovery
        ? [
            {
              name: t("dash.mock.note.noSession"),
              active: false,
              note: t("dash.mock.note.redFocus"),
            },
          ]
        : [
            { name: t("dash.mock.supp.betaAlanine"), dose: "3 g", active: !isRecovery },
            { name: t("dash.mock.supp.coffee"), dose: t("dash.mock.dose.caffeine"), active: !stressed, note: stressed ? t("dash.mock.note.lessCaffeine") : undefined },
            { name: t("dash.mock.supp.maca"), dose: "1500 mg", active: true },
          ],
    },
    {
      slot: "evening",
      label: t("dash.mock.slot.evening"),
      emoji: "🌙",
      items: [
        { name: t("dash.mock.supp.magnesium"), dose: "400 mg", active: true, note: stressed ? t("dash.mock.note.strongerDose") : undefined },
        { name: t("dash.mock.supp.ashwagandha"), dose: "600 mg", active: stressed, note: stressed ? t("dash.mock.note.activated") : undefined },
        { name: t("dash.mock.supp.collagen"), dose: "10 g", active: true },
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

export function buildSnack(fatigueScore: number, t: Translate = makeT("fr")): SnackInsight {
  if (fatigueScore <= 3) {
    return {
      titre: t("dash.mock.snack.pre.title"),
      contenu: t("dash.mock.snack.pre.content"),
      note: t("dash.mock.snack.pre.note"),
    };
  }
  if (fatigueScore <= 6) {
    return {
      titre: t("dash.mock.snack.light.title"),
      contenu: t("dash.mock.snack.light.content"),
      note: t("dash.mock.snack.light.note"),
    };
  }
  return {
    titre: t("dash.mock.snack.rec.title"),
    contenu: t("dash.mock.snack.rec.content"),
    note: t("dash.mock.snack.rec.note"),
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

/** Alerte « sommeil profond » dans n'importe quelle langue (le niveau d'alerte ne dépend pas de la langue). */
function isDeepSleepAlert(message: string): boolean {
  return LANGS.some((l) => message === translate(l, "dash.mock.sleepDeepRem") || message === translate(l, "dash.mock.sleepDeep"));
}

export function buildAlerts(fatigueScore: number, sleep: SleepInsight, t: Translate = makeT("fr")): Alert[] {
  const out: Alert[] = [];

  // Alertes sommeil — issues directement du mock sleep.
  for (const a of sleep.alerts) {
    out.push({
      level: isDeepSleepAlert(a) ? "warning" : "info",
      category: "sleep",
      message: a,
      hint: t("dash.mock.sleepHint"),
    });
  }

  if (fatigueScore >= 7) {
    out.push({
      level: "critical",
      category: "load",
      message: t("dash.mock.overload"),
      hint: t("dash.mock.overloadHint"),
    });
  } else if (fatigueScore >= 5) {
    out.push({
      level: "warning",
      category: "recovery",
      message: t("dash.mock.recoveryDown"),
      hint: t("dash.mock.recoveryDownHint"),
    });
  }

  // Une alerte blessure mock pour montrer la catégorie (sera désactivée
  // côté UI quand l'utilisateur n'a pas de blessure déclarée).
  if (fatigueScore >= 4) {
    out.push({
      level: "info",
      category: "injury",
      message: t("dash.mock.backPain"),
      hint: t("dash.mock.backPainHint"),
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
export function recommendVariant(ecm: EcmScore, t: Translate = makeT("fr")): SessionRecommendation {
  if (ecm.state === "green") {
    return { recommended: "A", reason: t("dash.mock.recoState.green") };
  }
  if (ecm.state === "yellow") {
    return { recommended: "B", reason: t("dash.mock.recoState.yellow") };
  }
  return { recommended: "B", reason: t("dash.mock.recoState.red") };
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
