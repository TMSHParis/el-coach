import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, ECM_ANALYSIS_MODEL, anthropicEnabled } from "@/lib/anthropic";
import { getUserId } from "@/lib/user-id";

export const runtime = "nodejs";

/** Ce que Claude lit sur l'écran de la montre, plus un retour narratif comparé à l'historique. */
export type PhotoExtraction = {
  calories: number | null;
  confidence: "high" | "low" | null;
  dureeMontre: string | null;
  bpmMoyen: number | null;
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
    required: ["calories", "confidence", "dureeMontre", "bpmMoyen", "donneesBrutes", "retourNarratif"],
    properties: {
      calories: {
        type: ["integer", "null"],
        description:
          "Calories brûlées affichées (kcal). null si l'image ne montre pas clairement ce chiffre — ne jamais deviner ni estimer.",
      },
      confidence: {
        type: ["string", "null"],
        enum: ["high", "low", null],
        description: "high si le chiffre est lu sans ambiguïté, low s'il est partiellement lisible, null si absent.",
      },
      dureeMontre: { type: ["string", "null"], description: "Durée de séance affichée, ex: '1h40' ou '01:40:00'. null si absente." },
      bpmMoyen: { type: ["integer", "null"], description: "BPM moyen affiché. null si absent." },
      donneesBrutes: {
        type: "object",
        description:
          "Autres métriques visibles sur l'image (zones cardiaques et leur durée, distance, allure, dénivelé...) — clé/valeur libre. Objet vide si rien d'autre n'est lisible.",
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
                text: `Cette image montre l'écran d'une montre connectée après une séance de sport.\n\n${contextLines}\n\nExtrais uniquement les données clairement lisibles sur l'image (ne devine ni n'estime jamais une valeur non visible) et appelle l'outil emit_photo_data avec un retour narratif de coach personnel, motivant, jamais générique.`,
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
        confidence: null,
        dureeMontre: null,
        bpmMoyen: null,
        donneesBrutes: null,
        retourNarratif: null,
      } satisfies PhotoExtraction);
    }

    const raw = toolUse.input as {
      calories: unknown;
      confidence: "high" | "low" | null;
      dureeMontre: string | null;
      bpmMoyen: unknown;
      donneesBrutes: Record<string, unknown> | null;
      retourNarratif: string | null;
    };
    const calories = cleanCalories(raw.calories);
    const result: PhotoExtraction = {
      calories,
      confidence: calories === null ? null : raw.confidence,
      dureeMontre: raw.dureeMontre ?? null,
      bpmMoyen: typeof raw.bpmMoyen === "number" && Number.isFinite(raw.bpmMoyen) ? Math.round(raw.bpmMoyen) : null,
      donneesBrutes: raw.donneesBrutes && Object.keys(raw.donneesBrutes).length > 0 ? raw.donneesBrutes : null,
      retourNarratif: raw.retourNarratif?.trim() || null,
    };
    return NextResponse.json(result);
  } catch (err) {
    console.error("extract-photo-data: lecture de la photo impossible:", err);
    // Pas une erreur bloquante : la saisie manuelle reste le filet.
    return NextResponse.json({
      calories: null,
      confidence: null,
      dureeMontre: null,
      bpmMoyen: null,
      donneesBrutes: null,
      retourNarratif: null,
    } satisfies PhotoExtraction);
  }
}
