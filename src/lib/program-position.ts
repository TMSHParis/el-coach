import "server-only";
import { prisma } from "./prisma";
import { getTemplate, resolveAdaptiveDay, type Day } from "./programming";
import { nextPositionAfter, pickFromSequence, sequenceFor, sessionsPerWeek } from "./program-sequence";
import { SPORT_LABEL_TO_SLUG } from "./ecm-programs";

export type SequenceInfo = {
  /** Jours des modèles composant la suite de l'utilisateur, dans l'ordre. */
  sequence: number[];
  position: number;
  /** Numéro de jour du modèle retenu aujourd'hui. */
  dayNumber: number;
  day: Day;
  manual: boolean;
};

/**
 * Séance du jour d'après la suite ordonnée. Null si la semaine type de
 * l'utilisateur ne contient pas ce programme : l'appelant garde alors la
 * correspondance par jour de la semaine.
 */
export async function resolveSequenceToday(input: {
  userId: string;
  slug: string;
  weekCycle: unknown;
  fatigueScore: number | null;
  manualDay?: number | null;
}): Promise<SequenceInfo | null> {
  const template = getTemplate(input.slug);
  if (!template) return null;
  const perWeek = sessionsPerWeek(input.weekCycle as Parameters<typeof sessionsPerWeek>[0], input.slug);
  if (perWeek === 0) return null;

  const modelDays = template.weeks[0].days.filter((d) => d.blocks.length > 0 || d.adaptive).map((d) => d.day);
  const sequence = sequenceFor(input.slug, perWeek, modelDays);
  const row = await prisma.programPosition.findUnique({
    where: { userId_programSlug: { userId: input.userId, programSlug: input.slug } },
  });
  const position = row?.position ?? 0;
  const manual = input.manualDay != null && modelDays.includes(input.manualDay);
  const dayNumber = manual ? (input.manualDay as number) : pickFromSequence(sequence, position);
  let day = template.weeks[0].days.find((d) => d.day === dayNumber);
  if (!day) return null;
  if (day.adaptive) {
    if (input.fatigueScore === null) return null;
    day = resolveAdaptiveDay(day, input.fatigueScore);
  }
  return { sequence, position, dayNumber, day, manual };
}

/** Avance la suite après une séance terminée (rattrapage et choix manuel compris). */
export async function advanceProgramPosition(input: {
  userId: string;
  slug: string;
  doneDay: number;
  weekCycle: unknown;
}): Promise<void> {
  const template = getTemplate(input.slug);
  if (!template) return;
  const perWeek = sessionsPerWeek(input.weekCycle as Parameters<typeof sessionsPerWeek>[0], input.slug);
  if (perWeek === 0) return;
  const modelDays = template.weeks[0].days.filter((d) => d.blocks.length > 0 || d.adaptive).map((d) => d.day);
  const sequence = sequenceFor(input.slug, perWeek, modelDays);
  const row = await prisma.programPosition.findUnique({
    where: { userId_programSlug: { userId: input.userId, programSlug: input.slug } },
  });
  const next = nextPositionAfter(sequence, row?.position ?? 0, input.doneDay);
  await prisma.programPosition.upsert({
    where: { userId_programSlug: { userId: input.userId, programSlug: input.slug } },
    create: { userId: input.userId, programSlug: input.slug, position: next },
    update: { position: next },
  });
}

/** Séance suivante de la suite de chaque programme ECM (check-in) : libellé du programme -> intitulé. */
export async function nextSessionByProgram(input: { userId: string | null; weekCycle: unknown }): Promise<Record<string, string>> {
  const rows = input.userId ? await prisma.programPosition.findMany({ where: { userId: input.userId } }) : [];
  const positions = new Map(rows.map((r) => [r.programSlug, r.position]));
  const out: Record<string, string> = {};
  for (const [label, slug] of Object.entries(SPORT_LABEL_TO_SLUG)) {
    const template = getTemplate(slug);
    if (!template) continue;
    const modelDays = template.weeks[0].days.filter((d) => d.blocks.length > 0 || d.adaptive).map((d) => d.day);
    // Sans créneau de ce programme dans la semaine : la suite complète du modèle.
    const perWeek = sessionsPerWeek(input.weekCycle as Parameters<typeof sessionsPerWeek>[0], slug) || modelDays.length;
    const sequence = sequenceFor(slug, perWeek, modelDays);
    const dayNumber = pickFromSequence(sequence, positions.get(slug) ?? 0);
    const day = template.weeks[0].days.find((d) => d.day === dayNumber);
    if (day) out[label] = day.focus;
  }
  return out;
}
