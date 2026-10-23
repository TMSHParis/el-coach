import { phaseNames, type PhaseKey } from "./competition-params";

/** Note ajoutée à la séance pendant l'affûtage d'un événement. */
export function PHASE_NAMES_NOTE(event: string, phase: PhaseKey, volumeFactor: number): string {
  const label = phaseNames(event)[phase];
  return `${label} · volume ${Math.round(volumeFactor * 100)} % du volume normal, intensité conservée.`;
}
