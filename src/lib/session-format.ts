// Correspondance entre le format de programmation (programming.ts) et l'affichage
// UI partagé par le dashboard (aperçu séance) et /session (moteur de chrono).

import { resolveExerciseMovement, displayBlockName, type Block, type BlockType, type Exercise, type WodFormat } from "./programming";

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

export type ExerciseDisplay = {
  name: string;
  qty: string;
  detail?: string;
  rest?: string;
  load?: string;
  /** Champs bruts de l'Exercise, exposés pour détecter le format de saisie
   * adapté (doc H.14) sans reparser `qty` — ex. gainage/isométrie = sets +
   * time sans reps. */
  sets?: number;
  reps?: number | string;
  time?: string;
  distance?: string;
};

/** Découpe un Exercise en {name, qty, detail, rest, load, sets, reps, time} pour les cartes dashboard/session. */
export function exerciseDisplay(ex: Exercise, movementName: string): ExerciseDisplay {
  let qty = "";
  if (ex.sets !== undefined && ex.reps !== undefined) qty = `${ex.sets}×${ex.reps}`;
  else if (ex.reps !== undefined) qty = String(ex.reps);
  else if (ex.sets !== undefined && ex.time) qty = `${ex.sets}×${ex.time}`;
  else if (ex.time) qty = ex.time;
  else if (ex.distance) qty = ex.distance;

  const name = ex.load ? `${movementName} (${ex.load})` : movementName;
  return { name, qty, detail: ex.notes, rest: ex.rest, load: ex.load, sets: ex.sets, reps: ex.reps, time: ex.time, distance: ex.distance };
}

export type DisplayBlock = {
  lettre: string;
  titre: string;
  badge: string;
  badgeCls: BadgeCls;
  /** Type brut du bloc (programming.ts) — pilote la saisie de résultats sur /session (charge/reps vs temps/rounds/score). */
  type: BlockType;
  items: (ExerciseDisplay & {
    movementName: string;
    /** Id du catalogue — sert à proposer des équivalents (mission 11). */
    movementId?: string;
    videoUrl?: string;
    /** Conseil/message, pas un mouvement : pas de bouton vidéo. */
    noVideo?: boolean;
    /** Mouvement remplacé pendant la séance : nom du mouvement prévu et raison (mission 11). */
    replacedFrom?: string;
    replacedReason?: string;
    /** Id du mouvement prévu (avant remplacement) : clé de la table d'équivalents. */
    plannedMovementId?: string;
  })[];
  note?: string;
  /** Format CrossFit du bloc (doc H.11 — fiche WOD écrite) — uniquement pertinent pour type "wod"/"conditioning". */
  format?: WodFormat;
  duration?: string;
  rounds?: number;
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
      type: block.type,
      items: block.exercises.map((ex) => {
        const movement = resolveExerciseMovement(ex);
        const movementName = movement?.name ?? ex.movementId;
        return { ...exerciseDisplay(ex, movementName), movementName, movementId: movement?.id ?? ex.movementId, videoUrl: movement?.videoUrl };
      }),
      note: block.notes,
      format: block.format,
      duration: block.duration,
      rounds: block.rounds,
    };
  });
}
