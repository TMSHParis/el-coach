// Correspondance entre le format de programmation (programming.ts) et l'affichage
// UI partagé par le dashboard (aperçu séance) et /session (moteur de chrono).

import { resolveExerciseMovement, displayBlockName, type Block, type Exercise } from "./programming";

export type BadgeCls = "nft" | "bth" | "ft" | "amrap" | "emom" | "tabata";
export type RuntimeFormat = "nft" | "ft" | "amrap" | "emom" | "tabata";

export function badgeForBlock(block: Block): { label: string; cls: BadgeCls } {
  const fmt = block.format;
  if (fmt === "AMRAP") return { label: "AMRAP", cls: "amrap" };
  if (fmt === "EMOM" || fmt === "E2MOM" || fmt === "E3MOM") return { label: fmt, cls: "emom" };
  if (fmt === "Tabata") return { label: "Tabata", cls: "tabata" };
  if (fmt === "ForTime" || fmt === "RFT" || fmt === "Chipper" || fmt === "Simulation") {
    return { label: "For Time", cls: "ft" };
  }
  if (block.type === "strength" || block.type === "skill") {
    return { label: "Build to Heavy", cls: "bth" };
  }
  if (block.type === "cooldown") return { label: "Facultatif", cls: "nft" };
  return { label: "Not For Time", cls: "nft" };
}

/** Format de chrono initial proposé — l'athlète peut toujours le changer dans /session. */
export function defaultRuntimeFormat(block: Block): RuntimeFormat {
  const fmt = block.format;
  if (fmt === "AMRAP") return "amrap";
  if (fmt === "EMOM" || fmt === "E2MOM" || fmt === "E3MOM") return "emom";
  if (fmt === "Tabata") return "tabata";
  if (fmt === "ForTime" || fmt === "RFT" || fmt === "Chipper" || fmt === "Simulation") return "ft";
  return "nft";
}

/** Durée par défaut (minutes) pour AMRAP/EMOM — extraite de block.duration ("15min" → 15). */
export function defaultDurationMinutes(block: Block): number {
  const match = block.duration?.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 10;
}

export type ExerciseDisplay = { name: string; qty: string; detail?: string };

/** Découpe un Exercise en {name, qty, detail} pour les cartes dashboard/session. */
export function exerciseDisplay(ex: Exercise, movementName: string): ExerciseDisplay {
  let qty = "";
  if (ex.sets !== undefined && ex.reps !== undefined) qty = `${ex.sets}×${ex.reps}`;
  else if (ex.reps !== undefined) qty = String(ex.reps);
  else if (ex.sets !== undefined && ex.time) qty = `${ex.sets}×${ex.time}`;
  else if (ex.time) qty = ex.time;
  else if (ex.distance) qty = ex.distance;

  const name = ex.load ? `${movementName} (${ex.load})` : movementName;
  return { name, qty, detail: ex.notes };
}

export type DisplayBlock = {
  lettre: string;
  titre: string;
  badge: string;
  badgeCls: BadgeCls;
  items: (ExerciseDisplay & { movementName: string; videoUrl?: string })[];
  note?: string;
};

/** Transforme les blocs bruts (programming.ts) en vue prête pour dashboard/session. */
export function toDisplayBlocks(blocks: Block[]): DisplayBlock[] {
  return blocks.map((block, i) => {
    const { label, cls } = badgeForBlock(block);
    return {
      lettre: String(i + 1),
      titre: displayBlockName(block),
      badge: label,
      badgeCls: cls,
      items: block.exercises.map((ex) => {
        const movement = resolveExerciseMovement(ex);
        const movementName = movement?.name ?? ex.movementId;
        return { ...exerciseDisplay(ex, movementName), movementName, videoUrl: movement?.videoUrl };
      }),
      note: block.notes,
    };
  });
}
