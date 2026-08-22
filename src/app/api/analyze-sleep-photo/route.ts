import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, SLEEP_VISION_MODEL, anthropicEnabled } from "@/lib/anthropic";

export const runtime = "nodejs";

type SleepPhotoAnalysis = {
  total: string | null;
  lent: string | null;
  rem: string | null;
  profond: string | null;
  eveil: string | null;
  coucher: string | null;
  reveil: string | null;
  alertes: string[];
  source: string | null;
};

const ANALYZE_TOOL = {
  name: "emit_sleep_photo_analysis",
  description: "Données de sommeil extraites d'une capture d'écran de montre connectée.",
  input_schema: {
    type: "object" as const,
    required: ["total", "lent", "rem", "profond", "eveil", "coucher", "reveil", "alertes", "source"],
    properties: {
      total: { type: ["string", "null"], description: 'ex: "8h30"' },
      lent: { type: ["string", "null"] },
      rem: { type: ["string", "null"] },
      profond: { type: ["string", "null"] },
      eveil: { type: ["string", "null"] },
      coucher: { type: ["string", "null"], description: 'ex: "23h15"' },
      reveil: { type: ["string", "null"], description: 'ex: "07h45"' },
      alertes: { type: "array", items: { type: "string" } },
      source: { type: ["string", "null"], description: "Apple Watch | Garmin | Polar | Whoop | Autre" },
    },
  },
};

export async function POST(req: Request) {
  if (!anthropicEnabled) {
    return NextResponse.json({ error: "Analyse photo indisponible (clé API absente)." }, { status: 503 });
  }

  const body = (await req.json()) as { imageBase64?: string; mediaType?: string };
  if (!body.imageBase64 || !body.mediaType) {
    return NextResponse.json({ error: "imageBase64 et mediaType requis." }, { status: 400 });
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(body.mediaType)) {
    return NextResponse.json({ error: "Format image non supporté." }, { status: 400 });
  }

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: SLEEP_VISION_MODEL,
      max_tokens: 500,
      tools: [ANALYZE_TOOL],
      tool_choice: { type: "tool", name: "emit_sleep_photo_analysis" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: body.mediaType as "image/jpeg" | "image/png" | "image/webp",
                data: body.imageBase64,
              },
            },
            {
              type: "text",
              text: "Analyse cette capture d'écran de suivi du sommeil (Apple Watch, Garmin, Polar, Whoop ou autre montre connectée). Extrait les données disponibles et appelle l'outil emit_sleep_photo_analysis. Si une donnée n'est pas visible, mets null. Ajoute une alerte si sommeil profond < 40min, REM < 1h30, ou éveil > 2h.",
            },
          ],
        },
      ],
    });

    const toolUse = response.content.find(
      (block) => block.type === "tool_use" && block.name === "emit_sleep_photo_analysis",
    ) as Anthropic.ToolUseBlock | undefined;
    if (!toolUse) {
      return NextResponse.json({ error: "Analyse impossible." }, { status: 502 });
    }

    return NextResponse.json(toolUse.input as SleepPhotoAnalysis);
  } catch (err) {
    console.error("analyze-sleep-photo failed:", err);
    return NextResponse.json({ error: "Analyse impossible." }, { status: 502 });
  }
}
