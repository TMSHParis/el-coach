// Thèmes de bloc (partie 2, 1.6 / 1.7 / 1.12). Un bloc dure 4 à 6 semaines,
// décharge comprise (la dernière semaine). Le thème change surtout le B2 et le
// poids du B3 ; la structure en 5 blocs et la semaine type restent. Les
// phrases de description sont reprises mot pour mot du document.
//
// Toutes les valeurs d'effet sont des valeurs de départ, validées par Mohamed
// mais pas par un coach : elles vivent dans ces tables, jamais dans la logique.

import type { Block, Day, Exercise } from "./programming";
import { blockRoles } from "./session-modular";
import { COACH_PARAMS } from "./coach-params";

export type ThemeDef = { id: string; label: string; description: string; isDefault?: boolean; auto?: boolean };

const EQUILIBRE: ThemeDef = {
  id: "equilibre",
  label: "Équilibré",
  description: "La semaine telle qu'écrite, sans accent particulier.",
  isDefault: true,
};

export const THEMES: Record<string, ThemeDef[]> = {
  "crossfit-pure": [
    EQUILIBRE,
    { id: "force", label: "Force", description: "Priorité à la force : charges plus lourdes et moins de répétitions au Bloc 2, métcons plus courts." },
    { id: "capacite", label: "Capacité", description: "Priorité à la capacité : plus de cardio et d'endurance, efforts plus longs au Bloc 3." },
    { id: "halterophilie", label: "Haltérophilie", description: "Priorité à l'haltérophilie : technique et explosivité au Bloc 2 (clean, snatch, jerk)." },
    { id: "points_faibles", label: "Points faibles", description: "Priorité à tes points faibles : tu choisis un ou deux mouvements à travailler." },
  ],
  "hybrid-cf-strength": [
    EQUILIBRE,
    { id: "hypertrophie", label: "Hypertrophie", description: "Priorité au volume de musculation : plus de séries sur les accessoires, finishers retirés." },
    { id: "force", label: "Force", description: "Priorité aux charges lourdes : séries courtes au Bloc 2, accessoires et finishers allégés." },
    { id: "endurance", label: "Endurance", description: "Priorité à l'endurance : force en entretien, Zone 2 allongée, sortie longue le samedi." },
  ],
  "hyrox-pure": [
    EQUILIBRE,
    { id: "force", label: "Force", description: "Priorité à la force : charges plus lourdes au Bloc 2, séance de course en entretien." },
    { id: "endurance", label: "Endurance", description: "Priorité à l'endurance : force en entretien, Zone 2 allongée, simulation complète le samedi si tu es en forme." },
    { id: "competition", label: "Compétition", auto: true, description: "Mode activé automatiquement d'après ta date de course. Les thèmes Force et Endurance ne s'appliquent plus." },
  ],
  "volume-block-hypertrophy": [
    { id: "hypertrophie", label: "Hypertrophie", isDefault: true, description: "Priorité à la masse musculaire : séries proches de l'échec technique." },
    { id: "force", label: "Force", description: "Priorité à la force : charges lourdes, séries courtes, repos longs." },
    { id: "endurance_musculaire", label: "Endurance musculaire", description: "Priorité à l'endurance musculaire : charges légères, séries longues, repos courts." },
  ],
  // At Home : pas de thème défini pour l'instant, seulement « Équilibré ».
  "at-home": [EQUILIBRE],
};

/** Repères affichés avec les filières Volume Block (valeurs générales ACSM 2009, à revoir avec l'ACSM 2026). */
export const VOLUME_BLOCK_MARKS: Record<string, { label: string; value: string }[]> = {
  hypertrophie: [
    { label: "Répétitions", value: "6 à 12" },
    { label: "Séries", value: "3 à 4" },
    { label: "Repos", value: "1 à 2 min" },
  ],
  force: [
    { label: "Charge", value: "lourde" },
    { label: "Séries", value: "plusieurs" },
    { label: "Repos", value: "2 à 3 min" },
  ],
  endurance_musculaire: [
    { label: "Répétitions", value: "10 à 15 et +" },
    { label: "Séries", value: "plusieurs" },
    { label: "Repos", value: "moins de 2 min" },
  ],
};

export function themesFor(slug: string): ThemeDef[] {
  return THEMES[slug] ?? [EQUILIBRE];
}
export function defaultThemeFor(slug: string): string {
  return themesFor(slug).find((t) => t.isDefault)?.id ?? "equilibre";
}
export function themeLabel(slug: string, id: string): string {
  return themesFor(slug).find((t) => t.id === id)?.label ?? id;
}

/** 1.7 — thème conseillé pour Volume Block d'après le premier objectif. */
export function suggestVolumeBlockTheme(obj: { type?: string | null; sousCat?: string | null; priorite?: string | null } | null): string {
  const type = (obj?.type ?? "").toLowerCase();
  const sub = (obj?.sousCat ?? "").toLowerCase();
  const prio = (obj?.priorite ?? "").toLowerCase();
  if (type.includes("masse")) return prio.includes("force") ? "force" : "hypertrophie";
  if (type.includes("recomposition")) return "hypertrophie";
  if (type.includes("performances")) {
    if (sub.includes("endurance")) return "endurance_musculaire";
    if (sub.includes("force") || sub.includes("explosivit")) return "force";
  }
  return "hypertrophie";
}

/** Mouvements proposés pour « Points faibles » (max 2) : libellé affiché → id du catalogue. */
export const WEAK_POINT_OPTIONS: { label: string; movementId: string }[] = [
  { label: "Double-Unders", movementId: "double-under" },
  { label: "Muscle-Ups", movementId: "muscle-up-barre" },
  { label: "Handstand", movementId: "handstand-hold" },
  { label: "Pull-Ups stricts", movementId: "strict-pullup" },
  { label: "Rope Climb", movementId: "rope-climb" },
  { label: "Snatch", movementId: "snatch" },
  { label: "Clean", movementId: "clean" },
  { label: "Course", movementId: "run" },
];
export const MAX_WEAK_POINTS = 2;

// ---------------------------------------------------------------------------
// Semaine dans le bloc
// ---------------------------------------------------------------------------

export type BlockWeekInfo = {
  /** 1-based ; au-delà de `weeks`, le bloc est terminé. */
  week: number;
  weeks: number;
  isDeload: boolean;
  finished: boolean;
};

export function blockWeekInfo(startDate: string, weeks: number, todayKey: string): BlockWeekInfo {
  const parse = (k: string) => {
    const [y, m, d] = k.split("-").map(Number);
    return new Date(y, m - 1, d).getTime();
  };
  const diffDays = Math.floor((parse(todayKey) - parse(startDate)) / 86_400_000);
  const week = Math.max(1, Math.floor(diffDays / 7) + 1);
  const finished = week > weeks;
  return { week: Math.min(week, weeks), weeks, isDeload: !finished && week === weeks, finished };
}

// ---------------------------------------------------------------------------
// Effets des thèmes
// ---------------------------------------------------------------------------

export type ThemeEffect = {
  /** Variation de séries sur le B2 / le B3 / les accessoires (B4). */
  b2SetsDelta?: number;
  b3SetsDelta?: number;
  b4SetsDelta?: number;
  /** Facteur sur la durée du B3 (« AMRAP de 8 à 10 min au lieu de 12 »). */
  b3DurationFactor?: number;
  /** Finishers (B4) : supprimés. */
  removeFinisher?: boolean;
  /** Ligne affichée sur la séance : ce que le thème change et qui ne se réduit pas à un chiffre. */
  note?: string;
};

export const THEME_EFFECTS: Record<string, Record<string, ThemeEffect>> = {
  "crossfit-pure": {
    force: {
      b3DurationFactor: 0.75,
      removeFinisher: true,
      note: "Thème Force : Back Squat, Strict Press et Deadlift en Build to Heavy, option lourde le vendredi, effort long toutes les 2 semaines.",
    },
    capacite: {
      b2SetsDelta: -1,
      b3DurationFactor: 1.4,
      note: "Thème Capacité : B2 raccourci, B3 plus long (AMRAP ou EMOM de 15 à 20 min), effort long chaque semaine.",
    },
    halterophilie: {
      note: "Thème Haltérophilie : plus de volume technique le jeudi (clean, snatch, jerk, complexes) ; lundi et vendredi en entretien ; samedi B2 : technique de snatch ou clean.",
    },
    points_faibles: {
      note: "Thème Points faibles : tes mouvements choisis s'ajoutent en skill (5 séries courtes, qualité) le mardi et le samedi, 10 à 15 min maximum.",
    },
  },
  "hybrid-cf-strength": {
    hypertrophie: {
      b3SetsDelta: 1,
      removeFinisher: true,
      note: "Thème Hypertrophie : lundi et mardi B2 en 4 × 6-8, accessoires en 4 séries, finishers retirés, Zone 2 du mercredi conservée.",
    },
    force: {
      b3SetsDelta: -1,
      removeFinisher: true,
      note: "Thème Force : B2 plus lourd (5 × 3 à 5 × 5), accessoires allégés, finishers supprimés, Zone 2 conservée.",
    },
    endurance: {
      b2SetsDelta: -1,
      note: "Thème Endurance : force en entretien (une série de moins, charges maintenues), Zone 2 du mercredi de 50 à 60 min, sortie longue du samedi recommandée.",
    },
  },
  "hyrox-pure": {
    force: {
      b2SetsDelta: 1,
      note: "Thème Force : B2 plus lourd (Build to Heavy, 5 séries et moins de reps), mardi en entretien (4 tours), samedi en half.",
    },
    endurance: {
      b2SetsDelta: -1,
      removeFinisher: true,
      note: "Thème Endurance : force en entretien, mardi à 6 tours, Zone 2 du vendredi de 60 à 75 min, samedi en full si l'état est vert.",
    },
    competition: {
      note: "Mode Compétition : phases et volumes d'après ta date de course.",
    },
  },
  "volume-block-hypertrophy": {},
  "at-home": {},
};

/** Filière Volume Block : reps / séries du B2 et des accessoires (la semaine ne change pas). */
const VB_FILIERES: Record<string, { b2: { sets: number; reps: string }; acc: { sets: number; reps: string } }> = {
  hypertrophie: { b2: { sets: 4, reps: "6-10" }, acc: { sets: 3, reps: "8-12" } },
  force: { b2: { sets: 5, reps: "3-5" }, acc: { sets: 3, reps: "6-8" } },
  endurance_musculaire: { b2: { sets: 3, reps: "12-20" }, acc: { sets: 3, reps: "15" } },
};
export const VB_REST: Record<string, string> = { hypertrophie: "2min", force: "2-3min", endurance_musculaire: "45s" };

function mapExercises(block: Block, fn: (ex: Exercise) => Exercise): Block {
  return { ...block, exercises: block.exercises.map(fn) };
}
function shiftSets(delta: number): (ex: Exercise) => Exercise {
  return (ex) => (typeof ex.sets === "number" ? { ...ex, sets: Math.max(1, ex.sets + delta) } : ex);
}
function scaleDuration(block: Block, factor: number): Block {
  const m = block.duration?.match(/(\d+)\s*min/);
  if (!m) return block;
  return { ...block, duration: block.duration!.replace(m[1], String(Math.max(5, Math.round(Number(m[1]) * factor)))) };
}

export type BlockContext = {
  slug: string;
  theme: string;
  week: BlockWeekInfo;
  weakPoints: string[];
  dayNumber: number;
};

/** Décharge (1.12) : mêmes mouvements, ~60 % du volume, pas de finisher. */
export function applyDeload(day: Day): Day {
  const roles = blockRoles(day.blocks);
  const f = COACH_PARAMS.deloadVolumeFactor;
  const blocks = day.blocks
    .map((b, i) => ({ b, role: roles[i] }))
    .filter(({ role }) => role !== "B4")
    .map(({ b }) => {
      const scaled = mapExercises(b, (ex) => (typeof ex.sets === "number" ? { ...ex, sets: Math.max(1, Math.round(ex.sets * f)) } : ex));
      return typeof scaled.rounds === "number" ? { ...scaled, rounds: Math.max(1, Math.round(scaled.rounds * f)) } : scaled;
    });
  return {
    ...day,
    blocks,
    estimatedMinutes: Math.max(15, Math.round(day.estimatedMinutes * f)),
    notes: [day.notes, "Semaine de décharge : environ 60 % du volume, mêmes mouvements, pas de finisher."].filter(Boolean).join(" "),
  };
}

/** Applique le thème du bloc puis, si c'est la dernière semaine, la décharge. */
export function applyBlockToDay(day: Day, ctx: BlockContext): Day {
  let out = day;
  const roles = blockRoles(out.blocks);

  if (ctx.slug === "volume-block-hypertrophy") {
    const fil = VB_FILIERES[ctx.theme];
    if (fil) {
      out = {
        ...out,
        blocks: out.blocks.map((b, i) => {
          const role = roles[i];
          const target = role === "B2" ? fil.b2 : role === "B3" || role === "B4" ? fil.acc : null;
          if (!target) return b;
          return mapExercises(b, (ex) =>
            typeof ex.sets === "number" ? { ...ex, sets: target.sets, reps: target.reps, rest: VB_REST[ctx.theme] ?? ex.rest } : ex,
          );
        }),
      };
    }
  } else {
    const eff = THEME_EFFECTS[ctx.slug]?.[ctx.theme];
    if (eff) {
      let blocks = out.blocks.map((b, i) => {
        const role = roles[i];
        let next = b;
        if (role === "B2" && eff.b2SetsDelta) next = mapExercises(next, shiftSets(eff.b2SetsDelta));
        if (role === "B3" && eff.b3SetsDelta) next = mapExercises(next, shiftSets(eff.b3SetsDelta));
        if (role === "B3" && eff.b3DurationFactor) next = scaleDuration(next, eff.b3DurationFactor);
        if (role === "B4" && eff.b4SetsDelta) next = mapExercises(next, shiftSets(eff.b4SetsDelta));
        return next;
      });
      if (eff.removeFinisher) {
        blocks = blocks.filter((_, i) => roles[i] !== "B4");
      }
      // Points faibles : mouvements choisis ajoutés en skill, le mardi et le samedi.
      if (ctx.theme === "points_faibles" && ctx.weakPoints.length > 0 && (ctx.dayNumber === 2 || ctx.dayNumber === 6)) {
        const skill: Block = {
          name: "Points faibles",
          type: "skill",
          format: "StraightSets",
          duration: "12min",
          exercises: ctx.weakPoints.map((id) => ({ movementId: id, sets: 5, reps: "courtes séries, qualité", rest: "60s" })),
        };
        const at = Math.min(2, blocks.length);
        blocks = [...blocks.slice(0, at), skill, ...blocks.slice(at)];
      }
      out = { ...out, blocks, notes: [out.notes, eff.note].filter(Boolean).join(" ") };
    }
  }

  return ctx.week.isDeload ? applyDeload(out) : out;
}
