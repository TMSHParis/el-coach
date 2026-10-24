import { phaseNames, type PhaseKey } from "./competition-params";
import { makeT, type Translate } from "./i18n";

/** Note ajoutée à la séance pendant l'affûtage d'un événement. */
export function PHASE_NAMES_NOTE(event: string, phase: PhaseKey, volumeFactor: number, t: Translate = makeT("fr")): string {
  const label = phaseNames(event, t)[phase];
  return t("srv.phase.noteTaper", { label, pct: Math.round(volumeFactor * 100) });
}
