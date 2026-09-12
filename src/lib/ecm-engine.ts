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
import { movements, type Movement } from "./movements";
import { WODS } from "./wods";
import { SOURCE_PROGRAM_EXAMPLES } from "./source-program-examples";
import type { Block, BlockType, Day, Exercise, WodFormat } from "./programming";
import { validateGeneratedDay } from "./session-adapt";

function normalizeAccents(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

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
  generatedDay: Day;
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
      "sessionBlocks",
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
      sessionBlocks: {
        type: "array",
        description:
          "La séance du jour, composée depuis MOUVEMENTS DISPONIBLES et WODS D'INSPIRATION. Exactement 5 blocs dans l'ordre : warmup, strength, wod, accessory (finisher), cooldown.",
        items: {
          type: "object",
          required: ["name", "type", "exercises"],
          properties: {
            name: { type: "string" },
            type: {
              type: "string",
              enum: ["warmup", "strength", "skill", "wod", "accessory", "conditioning", "endurance", "cooldown"],
            },
            format: {
              type: "string",
              enum: ["AMRAP", "EMOM", "E2MOM", "E3MOM", "ForTime", "Tabata", "Chipper", "RFT", "Intervals", "StraightSets", "Superset", "Circuit", "Simulation"],
            },
            duration: { type: "string", description: "ex: '10min'" },
            rounds: { type: "integer" },
            notes: { type: "string" },
            exercises: {
              type: "array",
              items: {
                type: "object",
                required: ["movementId"],
                properties: {
                  movementId: { type: "string", description: "DOIT être un id exact de la liste MOUVEMENTS DISPONIBLES — jamais inventé." },
                  sets: { type: "integer" },
                  reps: { type: "string", description: "ex: '12', '8-10', 'AMRAP'" },
                  time: { type: "string" },
                  distance: { type: "string" },
                  load: { type: "string" },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
};

// ============================================================================
// Sélection des candidats (mouvements + WODs) — déterministe, avant l'appel Claude.
// ============================================================================

function equipmentTierFor(profileEquipement: string): Movement["equipment"] | null {
  const e = normalizeAccents(profileEquipement);
  if (e.includes("salle complete")) return null; // null = tout le catalogue autorisé
  if (e.includes("maison")) return ["none", "dumbbell", "kettlebell", "resistance_band", "mat", "jump_rope", "box", "bench"];
  if (e.includes("exterieur") || e.includes("calisthenie")) return ["none", "outdoor", "pullup_bar", "parallel_bars", "trx"];
  return null; // "Les deux" ou valeur inconnue → tout autorisé
}

function levelRankFor(niveau: string): number {
  const n = normalizeAccents(niveau);
  if (n.includes("elite")) return 3;
  if (n.includes("avance")) return 2;
  if (n.includes("intermediaire")) return 1;
  return 0;
}

const LEVEL_RANK: Record<Movement["level"], number> = { beginner: 0, intermediate: 1, advanced: 2, elite: 3 };

/** Mouvements compatibles équipement/niveau — c'est la seule liste dans laquelle Claude a le droit de piocher. */
export function selectCandidateMovements(profile: Profile): Movement[] {
  const tier = equipmentTierFor(profile.equipement);
  const maxRank = Math.max(levelRankFor(profile.niveau), 1); // toujours un minimum de variété
  return movements.filter((m) => {
    if (LEVEL_RANK[m.level] > maxRank || m.gamesOnly) return false;
    if (!tier) return true;
    return m.equipment.some((e) => tier.includes(e)) || m.tags.includes("home-friendly");
  });
}

function formatMovementLine(m: Movement): string {
  return `${m.id} — ${m.name} [${m.equipment.join("/")}] (${m.level})`;
}

/** Échantillon de WODs (Girls/Hero/Open/benchmark) donné comme inspiration, jamais servi tel quel. */
function selectWodInspiration(limit = 16): string {
  const sample = WODS.filter((w) => w.category !== "open" || Math.random() < 0.6).slice(0, limit);
  return sample.map((w) => `- ${w.name} (${w.category}) — ${w.scheme} — ${w.description}`).join("\n");
}

/** movementId du "main lift" (1er exercice du bloc strength) des N derniers jours — évite la répétition. */
export function extractMainLift(day: Day | null | undefined): string | null {
  if (!day) return null;
  const strengthBlock = day.blocks.find((b) => b.type === "strength");
  return strengthBlock?.exercises[0]?.movementId ?? null;
}

function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const clone = { ...obj };
  for (const k of keys) delete clone[k];
  return clone;
}

/**
 * Fusionne profil (base permanente) et check-in du jour (le plus frais) en un
 * seul objet — le check-in écrase le profil sur les clés en commun (poids,
 * genre). C'est ce qui est envoyé à Claude ET ce qui est loggué pour
 * vérification (§1 de la note "Corrections prioritaires").
 */
export function buildDashboardData(profile: Profile, checkin: Checkin) {
  const profileData = omit(profile, ["id", "userId", "createdAt", "updatedAt"]);
  const checkinData = omit(checkin, ["id", "userId", "createdAt"]);
  return { ...profileData, ...checkinData };
}

const REQUIRED_DASHBOARD_FIELDS = [
  "programme",
  "niveau",
  "sportPrincipal",
  "joursS1",
  "heureS1",
  "dureeS1",
  "complements",
  "restrictions",
  "objectif",
  "seance",
  "energie",
  "motivation",
  "mental",
  "stress",
  "libido",
  "jambes",
] as const;

export async function generateEcmAnalysis(input: {
  profile: Profile;
  checkin: Checkin;
  sleep: SleepInsight;
  weight: WeightInsight;
  recentCheckins: Checkin[];
  /** movementId du "main lift" des ~14 derniers jours (le plus récent en premier) — évite la répétition. */
  recentMainLifts?: string[];
}): Promise<EcmAnalysisResult> {
  const { profile, checkin, sleep, weight, recentCheckins, recentMainLifts = [] } = input;

  const dataForDashboard = buildDashboardData(profile, checkin);

  // Vérification demandée par Kamel : logué avant l'appel Claude pour
  // confirmer en prod (logs Vercel) qu'aucun champ n'arrive vide par erreur.
  console.log("[generateEcmAnalysis] dataForDashboard →", dataForDashboard);
  const emptyRequired = REQUIRED_DASHBOARD_FIELDS.filter((key) => {
    const v = dataForDashboard[key as keyof typeof dataForDashboard];
    return v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
  });
  if (emptyRequired.length > 0) {
    console.warn("[generateEcmAnalysis] champs requis vides dans dataForDashboard →", emptyRequired);
  }

  const client = getAnthropicClient();

  const candidateMovements = selectCandidateMovements(profile);
  const movementLines = candidateMovements.map(formatMovementLine).join("\n");
  const wodInspiration = selectWodInspiration();
  const allowedMovementIds = new Set(movements.map((m) => m.id));

  const rotationLine =
    recentMainLifts.length > 0
      ? `MOUVEMENTS PRINCIPAUX DES 14 DERNIERS JOURS (à éviter en bloc "strength" si possible, pour varier) : ${recentMainLifts.join(", ")}.`
      : "Aucun historique récent — première génération ou pas de rotation à respecter.";

  const prompt = `Tu es le Coaching Adaptatif EL COACH METHOD. Analyse les données de cet athlète (profil fusionné avec le check-in du jour), compose la séance du jour à partir des MOUVEMENTS DISPONIBLES, puis appelle l'outil emit_ecm_analysis avec ton analyse complète.

DONNÉES ATHLÈTE (profil + check-in du jour déjà fusionnés — les champs du check-in, quand renseignés, ont déjà écrasé ceux du profil : ex. poids, genre) :
${JSON.stringify(dataForDashboard, null, 2)}

SOMMEIL CETTE NUIT (déjà calculé, ne pas recalculer) : ${sleep.lastNight.totalMinutes} min total, tendance 7j ${sleep.trendMinutes >= 0 ? "+" : ""}${sleep.trendMinutes} min.
POIDS : ${weight.today} kg, delta 7j ${weight.deltaWeek} kg.
NOMBRE DE CHECK-INS RÉCENTS DISPONIBLES : ${recentCheckins.length}.
${rotationLine}

MOUVEMENTS DISPONIBLES (équipement et niveau déjà filtrés pour cet athlète — ${candidateMovements.length} mouvements ; sessionBlocks.exercises[].movementId DOIT venir exclusivement de cette liste) :
${movementLines}

WODS D'INSPIRATION (benchmarks connus — inspire-toi du format/de l'intensité, ne les recopie pas nécessairement à l'identique, adapte aux mouvements disponibles) :
${wodInspiration}

EXEMPLES DE STRUCTURE DE PROGRAMMES SOURCES (styles externes reconnus — inspiration de structure/enchaînement uniquement, jamais servis tels quels) :
${SOURCE_PROGRAM_EXAMPLES.slice(0, 6000)}

RÈGLES :
- Les données ATHLÈTE ci-dessus sont déjà fusionnées avec la bonne priorité (check-in > profil) — utilise-les telles quelles, ne réinterprète pas de conflit.
- objectif / objectif2 = les 2 objectifs de l'athlète (objectif2 peut être vide).
- seance = le sport/la séance prévue par l'athlète CE JOUR (check-in) — peut différer de sportPrincipal (son sport habituel, profil) ; utilise seance en priorité pour orienter la séance du jour (programme/discipline à privilégier dans sessionBlocks).
- Le stack utilise UNIQUEMENT des compléments réalistes cohérents avec la liste "complements" (${profile.complements.join(", ") || "aucun déclaré — stack vide ou générique léger"}).
- recommendedVariant = "B" si état jaune/rouge ou douleur/blessure signalée, sinon "A".
- N'invente aucune donnée numérique (poids, sommeil) — utilise uniquement les valeurs fournies ci-dessus.
- Les alertes de la catégorie "injury" ne doivent apparaître que si blessures ou douleur est vrai.
- sessionBlocks : exactement 5 blocs dans l'ordre — type "warmup" (échauffement court), "strength" (main lift, 1 mouvement de force principal — varier par rapport aux 14 derniers jours listés ci-dessus si possible), "wod" (metcon/conditioning, inspiré de WODS D'INSPIRATION), "accessory" (finisher court), "cooldown" (mobilité/récupération, optionnel = facultatif). Adapte le volume/l'intensité à l'état du jour (énergie/jambes/mental/stress du check-in) — SANS retirer de mouvement pour cause de blessure : cette adaptation-là est gérée déterministiquement en aval, tu n'as pas à l'anticiper.
- Ne considère PAS les blessures/douleurs pour composer sessionBlocks (filet de sécurité séparé et déterministe après coup) — compose la séance "pleine forme" adaptée uniquement à l'énergie/l'équipement/le niveau/la séance prévue.
- Réponds uniquement via l'appel à l'outil, sans texte additionnel.`;

  const response = await client.messages.create({
    model: ECM_ANALYSIS_MODEL,
    max_tokens: 4000,
    tools: [STACK_TOOL],
    tool_choice: { type: "tool", name: "emit_ecm_analysis" },
    messages: [{ role: "user", content: prompt }],
  });

  const toolUse = response.content.find(
    (block) => block.type === "tool_use" && block.name === "emit_ecm_analysis",
  ) as Anthropic.ToolUseBlock | undefined;
  if (!toolUse) throw new Error("Claude n'a pas renvoyé d'analyse ECM (pas de tool_use).");

  type RawExercise = {
    movementId: string;
    sets?: number;
    reps?: string;
    time?: string;
    distance?: string;
    load?: string;
    notes?: string;
  };
  type RawBlock = {
    name: string;
    type: BlockType;
    format?: WodFormat;
    duration?: string;
    rounds?: number;
    notes?: string;
    exercises: RawExercise[];
  };

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
    sessionBlocks: RawBlock[];
  };

  const blocks: Block[] = (out.sessionBlocks ?? []).map((b) => ({
    name: b.name,
    type: b.type,
    format: b.format,
    duration: b.duration,
    rounds: b.rounds,
    notes: b.notes,
    exercises: b.exercises.map(
      (ex): Exercise => ({
        movementId: ex.movementId,
        sets: ex.sets,
        reps: ex.reps,
        time: ex.time,
        distance: ex.distance,
        load: ex.load,
        notes: ex.notes,
      }),
    ),
  }));

  const estimatedMinutes = blocks.reduce((total, b) => {
    const m = b.duration?.match(/(\d+)/);
    return total + (m ? Number(m[1]) : 8);
  }, 0);

  const rawDay: Day = {
    day: new Date().getDay() || 7,
    focus: dataForDashboard.seance || profile.sportPrincipal,
    estimatedMinutes: estimatedMinutes || 45,
    blocks,
  };

  const generatedDay = validateGeneratedDay(rawDay, allowedMovementIds);

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
    generatedDay,
  };
}
