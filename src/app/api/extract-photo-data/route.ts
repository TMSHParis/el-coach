import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, ECM_ANALYSIS_MODEL, anthropicEnabled } from "@/lib/anthropic";
import { getUserId } from "@/lib/user-id";
import { isRestLikeSeance } from "@/lib/seance-kinds";
import type { HeartRateZoneSplit } from "@/lib/ecm-engine";

export const runtime = "nodejs";

/** Ce que Claude lit sur l'écran de la montre, plus un retour narratif comparé à l'historique. */
export type PhotoExtraction = {
  /** Valeur retenue selon le type de jour (doc E.a) : "activité" un jour avec
   * effort isolé (ECM/hors-ECM), "totale" un jour repos/récup (pas d'effort
   * isolé à distinguer du reste de la journée). */
  calories: number | null;
  /** Laquelle des deux valeurs lues sur la montre a été retenue pour `calories` —
   * à ne pas confondre avec `caloriesSource` du modèle Session ("manuel"/"photo_auto"). */
  caloriesBase: "activite" | "totale" | null;
  confidence: "high" | "low" | null;
  dureeMontre: string | null;
  bpmMoyen: number | null;
  /** Répartition du temps par zone de FC (1 à 5) — doc E.b, lue sur la même capture. */
  heartRateZones: HeartRateZoneSplit[] | null;
  donneesBrutes: Record<string, unknown> | null;
  retourNarratif: string | null;
};

/** Une séance passée, résumée pour la comparaison ("2e meilleure valeur après ton record du 22 juillet"). */
export type HistoriqueSession = {
  date: string;
  calories: number | null;
  durationSec: number | null;
  feeling: string | null;
  donneesBrutes: Record<string, unknown> | null;
};

const ANALYZE_TOOL = {
  name: "emit_photo_data",
  description: "Données lues sur l'écran d'une montre connectée après une séance, avec retour narratif comparé à l'historique.",
  input_schema: {
    type: "object" as const,
    required: ["caloriesActivite", "caloriesTotales", "confidence", "dureeMontre", "bpmMoyen", "zones", "donneesBrutes", "retourNarratif"],
    properties: {
      caloriesActivite: {
        type: ["integer", "null"],
        description:
          "Calories de l'effort isolé affichées, ex. \"Kcal en activité\" ou \"Active calories\". null si l'image ne montre pas clairement ce chiffre — ne jamais deviner ni estimer.",
      },
      caloriesTotales: {
        type: ["integer", "null"],
        description:
          "Calories totales de la journée affichées, ex. \"Kilocalories totales\" ou \"Total calories\" (métabolisme de base + activité cumulés). null si absentes.",
      },
      confidence: {
        type: ["string", "null"],
        enum: ["high", "low", null],
        description: "high si les chiffres de calories sont lus sans ambiguïté, low si partiellement lisibles, null si absents.",
      },
      dureeMontre: { type: ["string", "null"], description: "Durée de séance affichée, ex: '1h40' ou '01:40:00'. null si absente." },
      bpmMoyen: { type: ["integer", "null"], description: "BPM/FC moyenne affichée. null si absent." },
      zones: {
        type: "array",
        description:
          "Répartition du temps passé par zone de fréquence cardiaque (1 à 5), si affichée sur l'image — une entrée par zone visible. Tableau vide si l'image ne montre pas cette répartition.",
        items: {
          type: "object",
          required: ["zone", "minutes"],
          properties: {
            zone: { type: "integer", enum: [1, 2, 3, 4, 5], description: "Numéro de la zone FC (1 = la plus basse, 5 = la plus haute)." },
            minutes: { type: "number", description: "Minutes passées dans cette zone." },
          },
        },
      },
      donneesBrutes: {
        type: "object",
        description:
          "Autres métriques visibles sur l'image (distance, allure, dénivelé...) — clé/valeur libre. Objet vide si rien d'autre n'est lisible.",
      },
      retourNarratif: {
        type: ["string", "null"],
        description:
          "3-4 phrases maximum : résumé de la séance, métrique la plus marquante comparée à l'historique fourni (record perso, moyenne, dernière séance similaire), croisement avec le poids du jour/le ressenti si pertinent. Ton motivant, personnel, jamais générique. null si aucune donnée exploitable sur la photo.",
      },
    },
  },
};

/** Seules les photos du store Blob du projet sont acceptées (pas d'URL arbitraire). */
function isAllowedPhotoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

function cleanCalories(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 5000 ? Math.round(value) : null;
}

function cleanZones(value: unknown): HeartRateZoneSplit[] | null {
  if (!Array.isArray(value)) return null;
  const zones = value
    .filter(
      (z): z is { zone: unknown; minutes: unknown } => typeof z === "object" && z !== null,
    )
    .map((z) => ({ zone: z.zone, minutes: z.minutes }))
    .filter(
      (z): z is HeartRateZoneSplit =>
        typeof z.zone === "number" &&
        [1, 2, 3, 4, 5].includes(z.zone) &&
        typeof z.minutes === "number" &&
        Number.isFinite(z.minutes) &&
        z.minutes > 0,
    );
  return zones.length > 0 ? zones : null;
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (!anthropicEnabled) {
    return NextResponse.json({ error: "Lecture automatique indisponible (clé API absente)." }, { status: 503 });
  }

  const body = (await req.json()) as {
    photoUrl?: string;
    sport?: string;
    prenom?: string;
    poidsJour?: string | null;
    sessionFeeling?: string | null;
    historiqueRecent?: HistoriqueSession[];
  };
  if (!body.photoUrl || !isAllowedPhotoUrl(body.photoUrl)) {
    return NextResponse.json({ error: "photoUrl invalide." }, { status: 400 });
  }

  const historique = (body.historiqueRecent ?? []).slice(0, 10);
  // Jour repos/récup : pas d'effort isolé à distinguer du reste de la journée
  // → on retient les calories totales plutôt que "en activité" (doc E.a).
  const isRestLike = isRestLikeSeance(body.sport);

  const contextLines = [
    body.sport ? `Sport de la séance : ${body.sport}.` : null,
    body.prenom ? `Prénom de l'athlète : ${body.prenom}.` : null,
    body.poidsJour ? `Poids du jour : ${body.poidsJour} kg.` : null,
    body.sessionFeeling ? `Ressenti de la séance : ${body.sessionFeeling}.` : null,
    historique.length > 0
      ? `Historique des séances précédentes (la plus récente en premier), pour comparaison :\n${JSON.stringify(historique)}`
      : "Aucun historique disponible — pas de comparaison possible, contente-toi du résumé de la séance.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create(
      {
        model: ECM_ANALYSIS_MODEL,
        max_tokens: 500,
        tools: [ANALYZE_TOOL],
        tool_choice: { type: "tool", name: "emit_photo_data" },
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "url", url: body.photoUrl } },
              {
                type: "text",
                text: `Cette image montre l'écran d'une montre connectée après une séance de sport. Elle peut afficher deux valeurs de calories distinctes ("Kcal en activité"/"Active calories" pour l'effort isolé, et "Kilocalories totales"/"Total calories" pour la journée entière) — lis les deux séparément si elles sont présentes, ne les confonds pas. Si une répartition du temps par zone de fréquence cardiaque (1 à 5) est affichée, lis-la aussi.\n\n${contextLines}\n\nExtrais uniquement les données clairement lisibles sur l'image (ne devine ni n'estime jamais une valeur non visible) et appelle l'outil emit_photo_data avec un retour narratif de coach personnel, motivant, jamais générique.`,
              },
            ],
          },
        ],
      },
      { timeout: 25_000 },
    );

    const toolUse = response.content.find(
      (block) => block.type === "tool_use" && block.name === "emit_photo_data",
    ) as Anthropic.ToolUseBlock | undefined;
    if (!toolUse) {
      return NextResponse.json({
        calories: null,
        caloriesBase: null,
        confidence: null,
        dureeMontre: null,
        bpmMoyen: null,
        heartRateZones: null,
        donneesBrutes: null,
        retourNarratif: null,
      } satisfies PhotoExtraction);
    }

    const raw = toolUse.input as {
      caloriesActivite: unknown;
      caloriesTotales: unknown;
      confidence: "high" | "low" | null;
      dureeMontre: string | null;
      bpmMoyen: unknown;
      zones: unknown;
      donneesBrutes: Record<string, unknown> | null;
      retourNarratif: string | null;
    };
    const caloriesActivite = cleanCalories(raw.caloriesActivite);
    const caloriesTotales = cleanCalories(raw.caloriesTotales);
    // Jour repos/récup → totales ; jour avec activité → en activité ; repli
    // sur l'autre valeur si celle attendue n'est pas lisible sur l'image.
    const preferred = isRestLike ? caloriesTotales : caloriesActivite;
    const fallback = isRestLike ? caloriesActivite : caloriesTotales;
    const calories = preferred ?? fallback;
    const caloriesBase: PhotoExtraction["caloriesBase"] =
      calories === null ? null : calories === preferred ? (isRestLike ? "totale" : "activite") : (isRestLike ? "activite" : "totale");

    const result: PhotoExtraction = {
      calories,
      caloriesBase,
      confidence: calories === null ? null : raw.confidence,
      dureeMontre: raw.dureeMontre ?? null,
      bpmMoyen: typeof raw.bpmMoyen === "number" && Number.isFinite(raw.bpmMoyen) ? Math.round(raw.bpmMoyen) : null,
      heartRateZones: cleanZones(raw.zones),
      donneesBrutes: raw.donneesBrutes && Object.keys(raw.donneesBrutes).length > 0 ? raw.donneesBrutes : null,
      retourNarratif: raw.retourNarratif?.trim() || null,
    };
    return NextResponse.json(result);
  } catch (err) {
    console.error("extract-photo-data: lecture de la photo impossible:", err);
    // Pas une erreur bloquante : la saisie manuelle reste le filet.
    return NextResponse.json({
      calories: null,
      caloriesBase: null,
      confidence: null,
      dureeMontre: null,
      bpmMoyen: null,
      heartRateZones: null,
      donneesBrutes: null,
      retourNarratif: null,
    } satisfies PhotoExtraction);
  }
}
