import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, SLEEP_VISION_MODEL, anthropicEnabled } from "@/lib/anthropic";
import { getUserId } from "@/lib/user-id";

export const runtime = "nodejs";

/** Ce que Claude lit sur l'écran de la montre — null dès que ce n'est pas net. */
export type PhotoExtraction = {
  calories: number | null;
  confidence: "high" | "low" | null;
};

const EXTRACT_TOOL = {
  name: "emit_photo_data",
  description: "Données lues sur l'écran d'une montre connectée après une séance.",
  input_schema: {
    type: "object" as const,
    required: ["calories", "confidence"],
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

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (!anthropicEnabled) {
    return NextResponse.json({ error: "Lecture automatique indisponible (clé API absente)." }, { status: 503 });
  }

  const body = (await req.json()) as { photoUrl?: string };
  if (!body.photoUrl || !isAllowedPhotoUrl(body.photoUrl)) {
    return NextResponse.json({ error: "photoUrl invalide." }, { status: 400 });
  }

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create(
      {
        model: SLEEP_VISION_MODEL,
        max_tokens: 200,
        tools: [EXTRACT_TOOL],
        tool_choice: { type: "tool", name: "emit_photo_data" },
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "url", url: body.photoUrl } },
              {
                type: "text",
                text: "Cette image montre l'écran d'une montre connectée après une séance de sport. Extrais uniquement le nombre de calories brûlées affiché (kcal). Si aucun chiffre de calories n'est clairement lisible, renvoie null — n'invente jamais une valeur et ne l'estime pas à partir de la durée ou de la fréquence cardiaque.",
              },
            ],
          },
        ],
      },
      { timeout: 20_000 },
    );

    const toolUse = response.content.find(
      (block) => block.type === "tool_use" && block.name === "emit_photo_data",
    ) as Anthropic.ToolUseBlock | undefined;
    if (!toolUse) return NextResponse.json({ calories: null, confidence: null } satisfies PhotoExtraction);

    const { calories, confidence } = toolUse.input as PhotoExtraction;
    // Garde-fou : une montre n'affiche jamais 20 000 kcal.
    const clean =
      typeof calories === "number" && Number.isFinite(calories) && calories > 0 && calories <= 5000
        ? Math.round(calories)
        : null;
    return NextResponse.json({ calories: clean, confidence: clean === null ? null : confidence });
  } catch (err) {
    console.error("extract-photo-data: lecture de la photo impossible:", err);
    // Pas une erreur bloquante : la saisie manuelle reste le filet.
    return NextResponse.json({ calories: null, confidence: null } satisfies PhotoExtraction);
  }
}
