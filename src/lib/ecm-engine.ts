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
import { ageFromDateNaissance } from "./age";

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

  // Une seule alerte par problème : profond + REM sous les seuils se fusionnent
  // (avant, les deux s'affichaient séparément et faisaient doublon).
  const alerts: string[] = [];
  const deepLow = lastNight.deepMinutes < 40;
  const remLow = lastNight.remMinutes < 90;
  if (deepLow && remLow) alerts.push("Sommeil profond et REM sous les seuils cette nuit");
  else if (deepLow) alerts.push("Sommeil profond < 40 min cette nuit");
  else if (remLow) alerts.push("REM < 1h30 cette nuit");
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

/** Même analyse sans séance composée — sport hors ECM ou repos (le bloc séance vient de generateNonEcmAdvice). */
export type EcmStateAnalysisResult = Omit<EcmAnalysisResult, "generatedDay">;

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

function equipmentTierFor(equipementLabel: string): Movement["equipment"] | null {
  const e = normalizeAccents(equipementLabel);
  if (e.includes("salle complete")) return null; // null = tout le catalogue autorisé
  if (e.includes("salle limitee")) return ["none", "dumbbell", "kettlebell", "machine", "cable", "resistance_band", "mat", "jump_rope", "box", "bench", "pullup_bar"];
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

/**
 * Mouvements compatibles équipement/niveau — c'est la seule liste dans laquelle Claude
 * a le droit de piocher. `equipementOverride` (checkin.seanceEquipement du jour, si
 * renseigné) prime sur `profile.equipement`.
 */
export function selectCandidateMovements(profile: Profile, equipementOverride?: string | null): Movement[] {
  const tier = equipmentTierFor(equipementOverride || profile.equipement);
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
  // dateNaissance n'est jamais envoyée telle quelle : Claude reçoit l'âge du
  // jour, recalculé à chaque génération (plus de champ âge figé en base).
  const profileData = omit(profile, ["id", "userId", "createdAt", "updatedAt", "dateNaissance"]);
  const checkinData = omit(checkin, ["id", "userId", "createdAt"]);
  return { ...profileData, age: ageFromDateNaissance(profile.dateNaissance), ...checkinData };
}

const REQUIRED_DASHBOARD_FIELDS = [
  "programme",
  "sportPrincipal",
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
  /** Focus du jour dans la programmation fixe (ex. "Squat lourd + couplet court") — référence par défaut si le check-in ne dit rien de spécifique. */
  weekTypeFocus?: string | null;
}): Promise<EcmAnalysisResult>;
export function generateEcmAnalysis(input: {
  profile: Profile;
  checkin: Checkin;
  sleep: SleepInsight;
  weight: WeightInsight;
  recentCheckins: Checkin[];
  /** false = sport hors ECM ou repos : score/stack/alertes/en-cas seulement, pas de sessionBlocks. */
  withSession: false;
}): Promise<EcmStateAnalysisResult>;
export async function generateEcmAnalysis(input: {
  profile: Profile;
  checkin: Checkin;
  sleep: SleepInsight;
  weight: WeightInsight;
  recentCheckins: Checkin[];
  recentMainLifts?: string[];
  weekTypeFocus?: string | null;
  withSession?: boolean;
}): Promise<EcmAnalysisResult | EcmStateAnalysisResult> {
  const { profile, checkin, sleep, weight, recentCheckins, recentMainLifts = [], weekTypeFocus = null } = input;
  const withSession = input.withSession ?? true;

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

  if (!withSession) {
    return generateStateOnlyAnalysis(client, dataForDashboard, profile, sleep, weight, recentCheckins.length);
  }

  const candidateMovements = selectCandidateMovements(profile, checkin.seanceEquipement);
  const movementLines = candidateMovements.map(formatMovementLine).join("\n");
  const wodInspiration = selectWodInspiration();
  const allowedMovementIds = new Set(movements.map((m) => m.id));

  const rotationLine =
    recentMainLifts.length > 0
      ? `MOUVEMENTS PRINCIPAUX DES 14 DERNIERS JOURS (à éviter en bloc "strength" si possible, pour varier) : ${recentMainLifts.join(", ")}.`
      : "Aucun historique récent — première génération ou pas de rotation à respecter.";

  const followsHabitualSport = normalizeAccents(checkin.seance ?? "").includes(normalizeAccents(profile.sportPrincipal ?? "___"));
  const hasCheckinOverride = !followsHabitualSport || Boolean(checkin.notes?.trim());
  const weekTypeLine = weekTypeFocus
    ? `SEMAINE TYPE DE RÉFÉRENCE (programme ${profile.programme}, focus habituel du jour) : ${weekTypeFocus}.${
        hasCheckinOverride
          ? " Le check-in du jour diffère (autre sport et/ou note renseignée) → IGNORE cette référence, le check-in fait foi."
          : " Rien de particulier dans le check-in → suis cette référence pour orienter le focus du jour."
      }`
    : "Pas de semaine type disponible (mode démo ou programme non résolu) — base-toi uniquement sur le check-in.";

  const prompt = `Tu es le Coaching Adaptatif EL COACH METHOD. Analyse les données de cet athlète (profil fusionné avec le check-in du jour), compose la séance du jour à partir des MOUVEMENTS DISPONIBLES, puis appelle l'outil emit_ecm_analysis avec ton analyse complète.

DONNÉES ATHLÈTE (profil + check-in du jour déjà fusionnés — les champs du check-in, quand renseignés, ont déjà écrasé ceux du profil : ex. poids, genre) :
${JSON.stringify(dataForDashboard, null, 2)}

SOMMEIL CETTE NUIT (déjà calculé, ne pas recalculer) : ${sleep.lastNight.totalMinutes} min total, tendance 7j ${sleep.trendMinutes >= 0 ? "+" : ""}${sleep.trendMinutes} min.
POIDS : ${weight.today} kg, delta 7j ${weight.deltaWeek} kg.
NOMBRE DE CHECK-INS RÉCENTS DISPONIBLES : ${recentCheckins.length}.
${rotationLine}
${weekTypeLine}

MOUVEMENTS DISPONIBLES (équipement et niveau déjà filtrés pour cet athlète — ${candidateMovements.length} mouvements ; sessionBlocks.exercises[].movementId DOIT venir exclusivement de cette liste) :
${movementLines}

WODS D'INSPIRATION (benchmarks connus — inspire-toi du format/de l'intensité, ne les recopie pas nécessairement à l'identique, adapte aux mouvements disponibles) :
${wodInspiration}

EXEMPLES DE STRUCTURE DE PROGRAMMES SOURCES (styles externes reconnus — inspiration de structure/enchaînement uniquement, jamais servis tels quels) :
${SOURCE_PROGRAM_EXAMPLES.slice(0, 6000)}

RÈGLES :
- Les données ATHLÈTE ci-dessus sont déjà fusionnées avec la bonne priorité (check-in > profil) — utilise-les telles quelles, ne réinterprète pas de conflit.
- objectif / objectif2 = les 2 objectifs de l'athlète (objectif2 peut être vide). Détails enrichis disponibles : objectif1Type/objectif1SousCat/objectif1Deadline/objectif1Priorite/objectif1Event (et objectif2Type/objectif2SousCat/objectif2Deadline/objectif2Priorite/objectif2Event pour le 2ème) — utilise-les pour affiner le ton et l'intensité (ex. deadline courte + priorité "Performance"/"Compétition" → séance plus exigeante ; objectif "Bien-être" ou priorité "Santé" → volume modéré, plus de mobilité/cooldown ; objectif "Je prépare mon corps à..." avec objectifXEvent renseigné → orienter vers les qualités utiles à cet événement).
- seance = le sport/la séance prévue par l'athlète CE JOUR (check-in) — peut différer de sportPrincipal (son sport habituel, profil) ; utilise seance en priorité pour orienter la séance du jour (programme/discipline à privilégier dans sessionBlocks).
- Priorité entre semaine type et check-in : suis la règle donnée par SEMAINE TYPE DE RÉFÉRENCE ci-dessus (elle indique déjà si le check-in l'emporte ou non pour aujourd'hui).
- Personnalisation du jour (seanceFocus/seanceDuree/seanceEquipement/seanceIntensite/seanceNote) : quand ces champs sont renseignés (non vides), ils priment SUR TOUT le reste (semaine type, profil.equipement — déjà appliqué dans MOUVEMENTS DISPONIBLES ci-dessus) pour composer sessionBlocks. seanceFocus oriente le choix des blocs (ex. "Mobilité" → réduit le bloc strength/wod, renforce cooldown) ; seanceDuree ajuste le nombre/la durée des blocs (30 min → 3 blocs courts, 2h+ → 5 blocs complets voire allongés) ; seanceIntensite ajuste charges/volume (Légère → StraightSets légers, Maximum → charges proches du max) ; seanceNote est une instruction directe à respecter littéralement (ex. "pas de deadlift aujourd'hui" → ne choisis aucun mouvement deadlift). Champs vides = ignore, comportement inchangé.
- Le stack utilise UNIQUEMENT des compléments réalistes cohérents avec la liste "complements" (${profile.complements.join(", ") || "aucun déclaré — stack vide ou générique léger"}).
- recommendedVariant = "B" si état jaune/rouge ou douleur/blessure signalée, sinon "A".
- N'invente aucune donnée numérique (poids, sommeil) — utilise uniquement les valeurs fournies ci-dessus.
- Les alertes de la catégorie "injury" ne doivent apparaître que si blessures ou douleur est vrai.
- sessionBlocks : exactement 5 blocs dans l'ordre — type "warmup" (échauffement court), "strength" (main lift, 1 mouvement de force principal — varier par rapport aux 14 derniers jours listés ci-dessus si possible), "wod" (metcon/conditioning, inspiré de WODS D'INSPIRATION), "accessory" (finisher court), "cooldown" (mobilité/récupération, optionnel = facultatif). Adapte le volume/l'intensité à l'état du jour (énergie/jambes/mental/stress du check-in) — SANS retirer de mouvement pour cause de blessure : cette adaptation-là est gérée déterministiquement en aval, tu n'as pas à l'anticiper.
- Ne considère PAS les blessures/douleurs pour composer sessionBlocks (filet de sécurité séparé et déterministe après coup) — compose la séance "pleine forme" adaptée uniquement à l'énergie/l'équipement/le niveau/la séance prévue.
- Réponds uniquement via l'appel à l'outil, sans texte additionnel.`;

  // Timeout explicite — évite qu'un appel qui pend bloque indéfiniment le
  // check-in ; le repli déterministe existant (checkin/actions.ts) prend le relais.
  const response = await client.messages.create(
    {
      model: ECM_ANALYSIS_MODEL,
      max_tokens: 4000,
      tools: [STACK_TOOL],
      tool_choice: { type: "tool", name: "emit_ecm_analysis" },
      messages: [{ role: "user", content: prompt }],
    },
    { timeout: 25_000 },
  );

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

const STATE_ONLY_TOOL = {
  ...STACK_TOOL,
  input_schema: {
    ...STACK_TOOL.input_schema,
    required: STACK_TOOL.input_schema.required.filter((k) => k !== "sessionBlocks"),
    properties: omit(STACK_TOOL.input_schema.properties, ["sessionBlocks"]),
  },
};

/**
 * Variante de generateEcmAnalysis pour un sport hors ECM ou un jour de repos :
 * le dashboard garde toute sa structure (score, stack, alertes, en-cas), seul
 * le bloc séance est remplacé par les conseils de generateNonEcmAdvice. Pas de
 * catalogue de mouvements dans le prompt — aucune séance à composer.
 */
async function generateStateOnlyAnalysis(
  client: ReturnType<typeof getAnthropicClient>,
  dataForDashboard: ReturnType<typeof buildDashboardData>,
  profile: Profile,
  sleep: SleepInsight,
  weight: WeightInsight,
  recentCheckinsCount: number,
): Promise<EcmStateAnalysisResult> {
  const rest = isRestDay(dataForDashboard.seance);
  const prompt = `Tu es le Coaching Adaptatif EL COACH METHOD. Analyse les données de cet athlète (profil fusionné avec le check-in du jour), puis appelle l'outil emit_ecm_analysis avec ton analyse complète.

AUJOURD'HUI : ${rest ? "jour de repos / récupération déclaré" : `activité hors programmation ECM : "${dataForDashboard.seance}"`} — aucune séance ECM à composer.

DONNÉES ATHLÈTE (profil + check-in du jour déjà fusionnés) :
${JSON.stringify(dataForDashboard, null, 2)}

SOMMEIL CETTE NUIT (déjà calculé, ne pas recalculer) : ${sleep.lastNight.totalMinutes} min total, tendance 7j ${sleep.trendMinutes >= 0 ? "+" : ""}${sleep.trendMinutes} min.
POIDS : ${weight.today} kg, delta 7j ${weight.deltaWeek} kg.
NOMBRE DE CHECK-INS RÉCENTS DISPONIBLES : ${recentCheckinsCount}.

RÈGLES :
- Le stack utilise UNIQUEMENT des compléments réalistes cohérents avec la liste "complements" (${profile.complements.join(", ") || "aucun déclaré — stack vide ou générique léger"}).${rest ? " Jour de repos : le moment pre-workout reste présent mais ses items sont inactifs (active: false)." : ""}
- recommendedVariant = "B" si état jaune/rouge ou douleur/blessure signalée, sinon "A" (champ technique, non affiché aujourd'hui).
- N'invente aucune donnée numérique (poids, sommeil) — utilise uniquement les valeurs fournies ci-dessus.
- Les alertes de la catégorie "injury" ne doivent apparaître que si blessures ou douleur est vrai.
- Réponds uniquement via l'appel à l'outil, sans texte additionnel.`;

  const response = await client.messages.create(
    {
      model: ECM_ANALYSIS_MODEL,
      max_tokens: 2000,
      tools: [STATE_ONLY_TOOL],
      tool_choice: { type: "tool", name: "emit_ecm_analysis" },
      messages: [{ role: "user", content: prompt }],
    },
    { timeout: 25_000 },
  );

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
    ecm: { state: out.state, letter: out.letter, numeric: out.numeric, headline: out.headline, summary: out.summary },
    recommendedVariant: out.recommendedVariant,
    recommendedReason: out.recommendedReason,
    stack: out.stack,
    alerts: out.alerts ?? [],
    snack: out.snack,
  };
}

// ============================================================================
// Contenu "hors programmation ECM" — sport non catalogué ou repos (sept. 2026).
// Pas de sessionBlocks (mouvements du catalogue non pertinents pour ces
// activités) : 3 sections texte courtes, affichées telles quelles sur le
// dashboard (pas de Séance A/B, pas de /session).
// ============================================================================

/** Séance d'un jour hors ECM (sport libre) ou de repos — 3 blocs, même mise en page que les séances ECM. */
export type NonEcmAdvice = {
  /** Durée estimée affichée en pied de séance, ex. "45-60 min". */
  dureeEstimee: string;
  /** Bloc 1 — échauffement spécifique au sport, ou récupération active un jour de repos. */
  warmup: { nom: string; duree?: string }[];
  /** Bloc 2 — prévention des blessures (ou points de vigilance un jour de repos). */
  prevention: string[];
  /** Bloc 3 — message mindset (repos : axé récupération). */
  mindset: string;
};

/** Ancien format (avant sept. 2026) encore stocké dans dashboard_outputs. */
export type LegacyNonEcmAdvice = {
  warmupTips: string[];
  preventionTips: string[];
  mindsetMessage: string;
};

const ADVICE_TOOL = {
  name: "emit_advice",
  description: "Séance du jour pour une activité hors programmation ECM (ou un jour de repos), en 3 blocs.",
  input_schema: {
    type: "object" as const,
    properties: {
      dureeEstimee: { type: "string", description: "Durée totale estimée de la séance, ex. \"45-60 min\"." },
      warmup: {
        type: "array",
        description: "4 à 6 exercices d'échauffement (ou de récupération active un jour de repos), dans l'ordre.",
        items: {
          type: "object",
          required: ["nom"],
          properties: {
            nom: { type: "string", description: "Nom court de l'exercice, ex. \"Corde à sauter souple\"." },
            duree: { type: "string", description: "Durée ou volume, ex. \"5-8 min\", \"2×10 répétitions\"." },
          },
        },
      },
      prevention: {
        type: "array",
        items: { type: "string" },
        description: "3 à 5 points de prévention des blessures (ou de vigilance), courts et actionnables.",
      },
      mindset: {
        type: "string",
        description: "Message de motivation court (1-2 phrases), ton direct, style coach.",
      },
    },
    required: ["dureeEstimee", "warmup", "prevention", "mindset"],
  },
};

const REST_LABELS = ["🛋️ Repos complet", "🚶 Récupération active"];

/** Vrai si `seance` est un jour de repos déclaré (check-in) plutôt qu'un sport. */
export function isRestDay(seance: string | null | undefined): boolean {
  return !seance || REST_LABELS.includes(seance);
}

/**
 * Compose la séance du jour (3 blocs) pour une activité hors des 5 programmes
 * ECM (ex. Boxe, Running, cours collectif) ou un jour de repos — appelée à la
 * place de la composition ECM, qui s'appuie sur le catalogue de mouvements.
 */
export async function generateNonEcmAdvice(input: { profile: Profile; checkin: Checkin }): Promise<NonEcmAdvice> {
  const { profile, checkin } = input;
  const client = getAnthropicClient();
  const rest = isRestDay(checkin.seance);
  const sport = checkin.seance || "activité non précisée";

  const prompt = `Tu es le Coaching Adaptatif EL COACH METHOD. L'athlète pratique aujourd'hui une activité hors des 5 programmations ECM catalogue : "${sport}"${rest ? " (jour de repos/récupération déclaré)" : ""}.

CONTEXTE ATHLÈTE :
- Blessures chroniques déclarées : ${profile.blessures ? profile.blessuresDetail || "oui, sans détail" : "aucune"}.
- Douleur signalée aujourd'hui (check-in) : ${checkin.douleur ? checkin.douleurDetail || "oui, sans détail" : "aucune"}.
- État du jour : énergie ${checkin.energie ?? "—"}/5, jambes ${checkin.jambes ?? "—"}, mental ${checkin.mental ?? "—"}, stress ${checkin.stress ?? "—"}.

Compose la séance du jour en 3 blocs, puis appelle l'outil emit_advice :
- dureeEstimee : ${rest ? "durée de la routine de récupération, ex. \"20-30 min\"." : `durée totale réaliste pour une séance de "${sport}", ex. \"45-60 min\".`}
- warmup : ${rest ? "4 à 6 exercices de récupération active (mobilité douce, étirements, marche), avec durée — PAS d'échauffement, c'est un jour de repos." : `4 à 6 exercices d'échauffement spécifiques à "${sport}" (mobilité, activation), avec durée pour chacun.`}
- prevention : ${
    rest
      ? `points de vigilance pour la journée${profile.blessures || checkin.douleur ? " selon les blessures/douleurs signalées ci-dessus (quoi éviter, quoi surveiller, quand consulter)" : " (aucune blessure déclarée : vigilance générale — raideurs, gestes du quotidien, retour à l'entraînement demain)"}.`
      : `prévention des blessures spécifique à cette activité${profile.blessures || checkin.douleur ? ", en tenant compte des blessures/douleurs signalées ci-dessus" : ""}.`
  }
- mindset : message court, direct, cohérent avec l'état du jour${rest ? ", axé récupération (le repos fait partie de la progression)" : ", motivant"}.
Réponds uniquement via l'appel à l'outil, sans texte additionnel.`;

  const response = await client.messages.create(
    {
      model: ECM_ANALYSIS_MODEL,
      max_tokens: 1200,
      tools: [ADVICE_TOOL],
      tool_choice: { type: "tool", name: "emit_advice" },
      messages: [{ role: "user", content: prompt }],
    },
    { timeout: 20_000 },
  );

  const toolUse = response.content.find(
    (block) => block.type === "tool_use" && block.name === "emit_advice",
  ) as Anthropic.ToolUseBlock | undefined;
  if (!toolUse) throw new Error("Claude n'a pas renvoyé de séance hors ECM (pas de tool_use).");

  return toolUse.input as NonEcmAdvice;
}

// ============================================================================
// Message mindset affiché juste après le check-in (page intermédiaire, sept.
// 2026) — généré une fois et stocké avec le dashboard du jour.
// ============================================================================

const MINDSET_TOOL = {
  name: "emit_mindset",
  description: "Message mindset court, affiché à l'athlète juste après son check-in.",
  input_schema: {
    type: "object" as const,
    properties: {
      message: {
        type: "string",
        description: "2-3 phrases max, inclut le prénom, direct et percutant, style coaching.",
      },
    },
    required: ["message"],
  },
};

/** Message mindset du jour — ton dicté par l'énergie du check-in (vert/jaune/rouge) ou le repos. */
export async function generateMindsetMessage(input: { profile: Profile; checkin: Checkin }): Promise<string> {
  const { profile, checkin } = input;
  const client = getAnthropicClient();
  const rest = isRestDay(checkin.seance);
  const energie = checkin.energie ?? 5;
  const ton = rest
    ? "Jour de repos — valorise la récupération : c'est là que le travail se transforme en progrès."
    : energie >= 8
      ? "Énergie haute (vert) — pousse-le à profiter de la journée pour repousser ses limites."
      : energie >= 5
        ? "Énergie moyenne (jaune) — valorise le fait d'y aller quand même, quitte à adapter l'intensité."
        : "Énergie basse (rouge) — séance légère, pas d'ego, la discipline compte plus que la performance.";

  const prompt = `Génère un message mindset court pour ${profile.prenom || "l'athlète"} avant sa séance.
État du jour (check-in) : énergie ${energie}/10 · mental ${checkin.mental ?? "—"} · stress ${checkin.stress ?? "—"}.
Sport du jour : ${checkin.seance || "non précisé"}.
Ton à adopter : ${ton}
2-3 phrases maximum · direct · percutant · style coaching · pas de blabla · inclure le prénom · varier les formulations.
Réponds uniquement via l'appel à l'outil, sans texte additionnel.`;

  const response = await client.messages.create(
    {
      model: ECM_ANALYSIS_MODEL,
      max_tokens: 300,
      tools: [MINDSET_TOOL],
      tool_choice: { type: "tool", name: "emit_mindset" },
      messages: [{ role: "user", content: prompt }],
    },
    { timeout: 15_000 },
  );

  const toolUse = response.content.find(
    (block) => block.type === "tool_use" && block.name === "emit_mindset",
  ) as Anthropic.ToolUseBlock | undefined;
  if (!toolUse) throw new Error("Claude n'a pas renvoyé de message mindset (pas de tool_use).");

  return (toolUse.input as { message: string }).message;
}

// ============================================================================
// Message de félicitations post-séance (sept. 2026) — généré une fois à la fin
// d'une séance (saveSessionResult), stocké dans dashboard_outputs du jour, pas
// régénéré au refresh. Ton adapté à l'état du check-in du jour (énergie/douleur).
// ============================================================================

const CONGRATS_TOOL = {
  name: "emit_congrats",
  description: "Message de félicitations post-séance, court et direct.",
  input_schema: {
    type: "object" as const,
    properties: {
      message: {
        type: "string",
        description: "2-3 phrases max, inclut le prénom, style coaching direct, jamais identique au message précédent.",
      },
    },
    required: ["message"],
  },
};

function congratsState(checkin: Checkin): "vert" | "jaune" | "rouge" | "douleur" {
  if (checkin.douleur) return "douleur";
  const energie = checkin.energie ?? 5;
  if (energie >= 8) return "vert";
  if (energie >= 5) return "jaune";
  return "rouge";
}

const CONGRATS_STATE_GUIDANCE: Record<ReturnType<typeof congratsState>, string> = {
  vert: "Énergie haute — ton conquérant, félicitations franches.",
  jaune: "Énergie moyenne — valorise l'effort malgré la fatigue, la régularité plutôt que la performance.",
  rouge: "Énergie basse — salue le courage d'avoir quand même fait la séance, insiste sur la récupération ce soir.",
  douleur: "Douleur signalée aujourd'hui — félicite la gestion intelligente du corps (avoir fait la séance adaptée plutôt que de forcer).",
};

/**
 * Génère le message de félicitations affiché en haut du dashboard après une
 * séance terminée. `previousMessage`, si fourni (dernier message généré, un
 * autre jour), sert uniquement à demander à Claude de ne pas le répéter.
 */
export async function generateSessionCongrats(input: {
  profile: Profile;
  checkin: Checkin;
  sportLabel: string;
  durationLabel: string;
  previousMessage?: string | null;
}): Promise<string> {
  const { profile, checkin, sportLabel, durationLabel, previousMessage } = input;
  const client = getAnthropicClient();
  const state = congratsState(checkin);

  const prompt = `Génère un message de félicitations post-séance pour ${profile.prenom || "l'athlète"}.
État du jour (check-in) : énergie ${checkin.energie ?? "—"}/10 · mental ${checkin.mental ?? "—"} · stress ${checkin.stress ?? "—"}.
Sport : ${sportLabel} · Durée : ${durationLabel}.
Ton à adopter : ${CONGRATS_STATE_GUIDANCE[state]}
2-3 phrases max · direct · style coaching · inclure le prénom.
${previousMessage ? `Ne répète jamais ce message déjà utilisé un jour précédent : "${previousMessage}"` : "Ne jamais utiliser une formule générique impersonnelle."}
Réponds uniquement via l'appel à l'outil, sans texte additionnel.`;

  const response = await client.messages.create(
    {
      model: ECM_ANALYSIS_MODEL,
      max_tokens: 300,
      tools: [CONGRATS_TOOL],
      tool_choice: { type: "tool", name: "emit_congrats" },
      messages: [{ role: "user", content: prompt }],
    },
    { timeout: 15_000 },
  );

  const toolUse = response.content.find(
    (block) => block.type === "tool_use" && block.name === "emit_congrats",
  ) as Anthropic.ToolUseBlock | undefined;
  if (!toolUse) throw new Error("Claude n'a pas renvoyé de message de félicitations (pas de tool_use).");

  return (toolUse.input as { message: string }).message;
}
