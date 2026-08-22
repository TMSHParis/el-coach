import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export const anthropicEnabled = Boolean(process.env.ANTHROPIC_API_KEY);

// Sonnet 5 pour l'analyse quotidienne (qualité de raisonnement), Haiku 4.5 pour
// l'extraction vision (tâche simple, coût réduit — appelée à chaque photo).
export const ECM_ANALYSIS_MODEL = "claude-sonnet-5";
export const SLEEP_VISION_MODEL = "claude-haiku-4-5-20251001";
