// Point de génération unique des messages coach (mindset, félicitations
// post-séance...) — un seul appel Claude générique réutilisé par les
// différents écrans, plutôt que des prompts dupliqués indépendants (doc A).
//
// Mémoire courte : chaque génération renvoie aussi 1-3 tags courts résumant
// son thème (ex. "repos_evoque", "charge_elevee"). Les appelants les
// persistent (DashboardOutput.output.coachTags) et les repassent en entrée
// des générations suivantes (2-3 derniers jours) pour que Claude évite de
// répéter le même thème/formulation d'un jour à l'autre.

import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, ECM_ANALYSIS_MODEL } from "./anthropic";
import { LANG_META, type Lang } from "./i18n";

export type CoachTagsByDay = { date: string; tags: string[] }[];

export type CoachMessageResult = { message: string; tags: string[] };

/**
 * Consigne de langue à ajouter à chaque prompt Claude : toute la prose visible est rédigée dans la
 * langue demandée ; les clés JSON/outils, noms de mouvements, de programmes et de formats restent inchangés.
 */
export function langInstruction(lang: Lang = "fr"): string {
  const name = LANG_META[lang].name;
  return `\nLANGUE DE SORTIE (obligatoire) : rédige TOUT le texte visible par l'athlète (messages, titres, phrases, conseils, libellés, notes) en ${name}, quelle que soit la langue de ces instructions. Les clés techniques de l'outil et les valeurs d'énumération restent inchangées. Les noms de mouvements, de programmes (CrossFit Pure, Hybrid Engine, Hyrox Pure, Volume Block Hypertrophy, At Home) et de formats (For Time, AMRAP, EMOM, Tabata, Superset, Circuit, StraightSets...) restent en anglais, non traduits.`;
}

/** Résumé des thèmes déjà abordés récemment — à insérer dans le prompt pour éviter les redites. */
export function formatRecentTags(recent: CoachTagsByDay): string {
  const withTags = recent.filter((r) => r.tags.length > 0);
  if (withTags.length === 0) return "";
  return `\nThèmes déjà abordés les jours précédents (évite de répéter le même thème ou la même formulation) : ${withTags
    .map((r) => `${r.date} → ${r.tags.join(", ")}`)
    .join(" · ")}`;
}

/**
 * Appel Claude générique pour un message coach court — même mécanique
 * (tool-call forcé, message + tags) quelle que soit la brique appelante.
 */
export async function callCoachMessage(opts: {
  toolName: string;
  toolDescription: string;
  messageDescription: string;
  prompt: string;
  lang?: Lang;
}): Promise<CoachMessageResult> {
  const client = getAnthropicClient();
  const tool = {
    name: opts.toolName,
    description: opts.toolDescription,
    input_schema: {
      type: "object" as const,
      properties: {
        message: { type: "string", description: opts.messageDescription },
        tags: {
          type: "array",
          items: { type: "string" },
          description:
            "1 à 3 tags courts en snake_case résumant le thème du message (ex: repos_evoque, charge_elevee, encouragement_effort) — réutilisés pour éviter de répéter le même thème les jours suivants.",
        },
      },
      required: ["message", "tags"],
    },
  };

  const response = await client.messages.create(
    {
      model: ECM_ANALYSIS_MODEL,
      max_tokens: 300,
      tools: [tool],
      tool_choice: { type: "tool", name: opts.toolName },
      messages: [{ role: "user", content: opts.prompt + langInstruction(opts.lang) }],
    },
    { timeout: 15_000 },
  );

  const toolUse = response.content.find(
    (block) => block.type === "tool_use" && block.name === opts.toolName,
  ) as Anthropic.ToolUseBlock | undefined;
  if (!toolUse) throw new Error(`Claude n'a pas renvoyé de message coach (${opts.toolName}, pas de tool_use).`);

  const out = toolUse.input as { message: string; tags?: string[] };
  return { message: out.message, tags: Array.isArray(out.tags) ? out.tags.slice(0, 3) : [] };
}
