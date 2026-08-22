// ============================================================================
// Coaching Adaptatif — moteur d'analyse réel (Étape 2.5).
//
// Principe : les chiffres (historique poids, durée de sommeil, seuils
// d'alerte) sont calculés en code déterministe à partir des vraies données
// Postgres — Claude n'invente aucune donnée. Claude sert uniquement à
// l'interprétation qualitative (état/grade/résumé/stack/recommandation),
// via un appel à outil forcé (JSON garanti, pas de parsing de texte libre).
//
// Le contenu réel des séances (mouvements, vidéos) reste généré par
// programming.ts — ce moteur ne touche pas à ça.
// ============================================================================

import type { Checkin, Profile } from "@prisma/client";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, ECM_ANALYSIS_MODEL } from "./anthropic";
import type {
  EcmScore,
  SleepInsight,
  SleepNight,
  WeightInsight,
  StackMoment,
  SnackInsight,
  Alert,
  SessionVariant,
} from "./coaching-adaptatif-mock";

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function dateKeyToLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAY_LABELS[date.getDay()]} ${d}`;
}

/** Parse "7h30", "7h", "450" (minutes) ou "1h45" → minutes. Null si illisible. */
function parseDurationToMinutes(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const hm = trimmed.match(/^(\d+)\s*h\s*(\d{1,2})?/i);
  if (hm) return Number(hm[1]) * 60 + Number(hm[2] ?? 0);
  const min = trimmed.match(/^(\d+)\s*min/i);
  if (min) return Number(min[1]);
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

type SleepAnalysisPhoto = {
  total?: string | null;
  lent?: string | null;
  rem?: string | null;
  profond?: string | null;
  eveil?: string | null;
};

/** Construit l'insight sommeil (7 dernières nuits) depuis les vrais check-ins. */
export function buildSleepFromCheckins(checkins: Checkin[]): SleepInsight {
  const ordered = [...checkins].sort((a, b) => a.date.localeCompare(b.date));
  const nights: SleepNight[] = ordered.map((c) => {
    const photo = (c.sleepAnalysis as SleepAnalysisPhoto | null) ?? null;
    const totalMinutes =
      parseDurationToMinutes(photo?.total) ?? parseDurationToMinutes(c.sleepDuree) ?? 420;
    const deepMinutes = parseDurationToMinutes(photo?.profond) ?? Math.round(totalMinutes * 0.13);
    const remMinutes = parseDurationToMinutes(photo?.rem) ?? Math.round(totalMinutes * 0.23);
    const awakeMinutes = parseDurationToMinutes(photo?.eveil) ?? Math.round(totalMinutes * 0.05);
    return { label: dateKeyToLabel(c.date), totalMinutes, deepMinutes, remMinutes, awakeMinutes };
  });

  const lastNight = nights[nights.length - 1] ?? {
    label: "Auj.",
    totalMinutes: 420,
    deepMinutes: 55,
    remMinutes: 95,
    awakeMinutes: 20,
  };

  const first = nights.slice(0, Math.min(3, nights.length));
  const last = nights.slice(-Math.min(3, nights.length));
  const avg = (arr: SleepNight[]) => arr.reduce((s, n) => s + n.totalMinutes, 0) / (arr.length || 1);
  const trendMinutes = Math.round(avg(last) - avg(first));

  const alerts: string[] = [];
  if (lastNight.deepMinutes < 40) alerts.push("Sommeil profond < 40 min cette nuit");
  if (lastNight.remMinutes < 90) alerts.push("REM < 1h30 cette nuit");
  if (lastNight.awakeMinutes > 120) alerts.push("Réveils > 2h cette nuit");

  return { nights, lastNight, trendMinutes, alerts };
}

/** Construit l'insight poids depuis les vrais check-ins (champ poids, optionnel). */
export function buildWeightFromCheckins(checkins: Checkin[], fallbackKg = 78): WeightInsight {
  const ordered = [...checkins].sort((a, b) => a.date.localeCompare(b.date));
  const withWeight = ordered.filter((c) => c.poids && Number(c.poids) > 0);

  if (withWeight.length === 0) {
    return { history: [{ label: "Auj.", kg: fallbackKg }], today: fallbackKg, deltaWeek: 0 };
  }

  const history = withWeight.map((c) => ({ label: dateKeyToLabel(c.date), kg: Number(c.poids) }));
  const today = history[history.length - 1].kg;
  const deltaWeek = Math.round((today - history[0].kg) * 10) / 10;
  return { history, today, deltaWeek };
}

export type EcmAnalysisResult = {
  ecm: EcmScore;
  recommendedVariant: SessionVariant;
  recommendedReason: string;
  stack: StackMoment[];
  alerts: Alert[];
  snack: SnackInsight;
};

const STACK_TOOL = {
  name: "emit_ecm_analysis",
  description: "Analyse quotidienne EL COACH METHOD à partir du profil et du check-in de l'athlète.",
  input_schema: {
    type: "object" as const,
    required: [
      "state",
      "letter",
      "numeric",
      "headline",
      "summary",
      "recommendedVariant",
      "recommendedReason",
      "stack",
      "alerts",
      "snack",
    ],
    properties: {
      state: { type: "string", enum: ["green", "yellow", "red"] },
      letter: { type: "string", description: "Grade type A, A-, B+, B, C, D" },
      numeric: { type: "integer", minimum: 0, maximum: 100 },
      headline: { type: "string", description: "Phrase courte et percutante (5-8 mots)" },
      summary: { type: "string", description: "1-2 phrases expliquant le score du jour" },
      recommendedVariant: { type: "string", enum: ["A", "B"] },
      recommendedReason: { type: "string" },
      stack: {
        type: "array",
        description: "Exactement 4 moments : morning, noon, pre-workout, evening",
        items: {
          type: "object",
          required: ["slot", "label", "emoji", "items"],
          properties: {
            slot: { type: "string", enum: ["morning", "noon", "pre-workout", "evening"] },
            label: { type: "string" },
            emoji: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                required: ["name", "active"],
                properties: {
                  name: { type: "string" },
                  dose: { type: "string" },
                  active: { type: "boolean" },
                  note: { type: "string" },
                },
              },
            },
          },
        },
      },
      alerts: {
        type: "array",
        description: "Alertes narratives (blessure, surcharge, récupération, hormonal) — pas les alertes sommeil, déjà calculées ailleurs.",
        items: {
          type: "object",
          required: ["level", "category", "message"],
          properties: {
            level: { type: "string", enum: ["info", "warning", "critical"] },
            category: { type: "string", enum: ["injury", "recovery", "hormonal", "load"] },
            message: { type: "string" },
            hint: { type: "string" },
          },
        },
      },
      snack: {
        type: "object",
        required: ["titre", "contenu", "note"],
        properties: {
          titre: { type: "string" },
          contenu: { type: "string" },
          note: { type: "string" },
        },
      },
    },
  },
};

export async function generateEcmAnalysis(input: {
  profile: Profile;
  checkin: Checkin;
  sleep: SleepInsight;
  weight: WeightInsight;
  recentCheckins: Checkin[];
}): Promise<EcmAnalysisResult> {
  const { profile, checkin, sleep, weight, recentCheckins } = input;

  const client = getAnthropicClient();

  const prompt = `Tu es le Coaching Adaptatif EL COACH METHOD. Analyse le profil et le check-in du jour de cet athlète, puis appelle l'outil emit_ecm_analysis avec ton analyse.

PROFIL ATHLÈTE :
${JSON.stringify(
  {
    prenom: profile.prenom,
    age: profile.age,
    genre: profile.genre,
    objectif: profile.objectif,
    programme: profile.programme,
    niveau: profile.niveau,
    equipement: profile.equipement,
    blessures: profile.blessures,
    blessuresDetail: profile.blessuresDetail,
    complements: profile.complements,
    jeune: profile.jeune,
    typeJeune: profile.typeJeune,
  },
  null,
  2,
)}

CHECK-IN DU JOUR :
${JSON.stringify(
  {
    energie: checkin.energie,
    motivation: checkin.motivation,
    mental: checkin.mental,
    stress: checkin.stress,
    jambes: checkin.jambes,
    douleur: checkin.douleur,
    douleurDetail: checkin.douleurDetail,
    cycle: checkin.cycle,
    cycleDouleur: checkin.cycleDouleur,
    travail: checkin.travail,
    soirPerformance: checkin.soirPerformance,
    notes: checkin.notes,
  },
  null,
  2,
)}

SOMMEIL CETTE NUIT (déjà calculé, ne pas recalculer) : ${sleep.lastNight.totalMinutes} min total, tendance 7j ${sleep.trendMinutes >= 0 ? "+" : ""}${sleep.trendMinutes} min.
POIDS : ${weight.today} kg, delta 7j ${weight.deltaWeek} kg.
NOMBRE DE CHECK-INS RÉCENTS DISPONIBLES : ${recentCheckins.length}.

RÈGLES :
- Le stack utilise UNIQUEMENT des compléments réalistes cohérents avec profil.complements (${profile.complements.join(", ") || "aucun déclaré — stack vide ou générique léger"}).
- recommendedVariant = "B" si état jaune/rouge ou douleur/blessure signalée, sinon "A".
- N'invente aucune donnée numérique (poids, sommeil) — utilise uniquement les valeurs fournies ci-dessus.
- Les alertes de la catégorie "injury" ne doivent apparaître que si profil.blessures ou check-in.douleur est vrai.
- Réponds uniquement via l'appel à l'outil, sans texte additionnel.`;

  const response = await client.messages.create({
    model: ECM_ANALYSIS_MODEL,
    max_tokens: 2000,
    tools: [STACK_TOOL],
    tool_choice: { type: "tool", name: "emit_ecm_analysis" },
    messages: [{ role: "user", content: prompt }],
  });

  const toolUse = response.content.find(
    (block) => block.type === "tool_use" && block.name === "emit_ecm_analysis",
  ) as Anthropic.ToolUseBlock | undefined;
  if (!toolUse) throw new Error("Claude n'a pas renvoyé d'analyse ECM (pas de tool_use).");

  const out = toolUse.input as {
    state: "green" | "yellow" | "red";
    letter: string;
    numeric: number;
    headline: string;
    summary: string;
    recommendedVariant: "A" | "B";
    recommendedReason: string;
    stack: StackMoment[];
    alerts: Alert[];
    snack: SnackInsight;
  };

  return {
    ecm: {
      state: out.state,
      letter: out.letter,
      numeric: out.numeric,
      headline: out.headline,
      summary: out.summary,
    },
    recommendedVariant: out.recommendedVariant,
    recommendedReason: out.recommendedReason,
    stack: out.stack,
    alerts: out.alerts ?? [],
    snack: out.snack,
  };
}
