"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/user-id";
import { todayKey } from "@/lib/date-key";
import { SPORT_LABEL_TO_SLUG } from "@/lib/ecm-programs";
import { COACH_PARAMS } from "@/lib/coach-params";
import { getOrCreateActiveBlock } from "@/lib/training-block";
import { MAX_WEAK_POINTS, WEAK_POINT_OPTIONS, suggestThemeForBlock, themesFor } from "@/lib/training-themes";
import { axesOf, competitionPlanFor } from "@/lib/competition";
import { SPORT_PROGRAM } from "@/lib/competition-params";
import { mondayOf } from "@/lib/week";

export type ThemeScreenData = {
  slug: string;
  programName: string;
  themes: { id: string; label: string; description: string; isDefault?: boolean; auto?: boolean }[];
  current: { theme: string; weeks: number; week: number; isDeload: boolean; finished: boolean; weakPoints: string[] };
  /** Thème conseillé (Volume Block, ou table axe -> thème du coach) pour le bloc courant ou suivant. */
  suggested: string | null;
  objectifLabel: string | null;
  /** Mode compétition actif (date d'événement Hyrox ou CrossFit Games) : Force, Endurance, Capacité, Haltérophilie ne s'appliquent plus. */
  competition: boolean;
  /** Blocs déjà terminés pour ce programme : sert à choisir l'axe suivant. */
  blocksDone: number;
};

export async function getThemeScreenData(): Promise<ThemeScreenData | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const profile = await prisma.profile.findUnique({ where: { userId } });
  const slug = profile ? SPORT_LABEL_TO_SLUG[profile.programme] : undefined;
  if (!profile || !slug) return null;
  const block = await getOrCreateActiveBlock(userId, slug, todayKey());
  const blocksDone = await prisma.trainingBlock.count({ where: { userId, programme: slug, active: false } });
  // Bloc en cours : l'axe du bloc ; bloc terminé : l'axe suivant.
  const blockIndex = block.info.finished ? blocksDone + 1 : blocksDone;
  const suggested = suggestThemeForBlock(
    slug,
    { type: profile.objectif1Type ?? profile.objectif, sousCat: profile.objectif1SousCat, priorite: profile.objectif1Priorite, axes: axesOf(profile.objectif1Details, profile.objectif1SousCat) },
    blockIndex,
  );
  const plan = competitionPlanFor(profile, todayKey());
  const programForEvent = plan ? SPORT_PROGRAM[plan.event] : null;
  const competition = !!plan && !!programForEvent?.competitionMode && programForEvent.program !== null && profile.programme.endsWith(programForEvent.program);
  return {
    slug,
    programName: profile.programme.replace(/^\S+\s*/, ""),
    themes: themesFor(slug),
    current: {
      theme: block.theme,
      weeks: block.weeks,
      week: block.info.week,
      isDeload: block.info.isDeload,
      finished: block.info.finished,
      weakPoints: block.weakPoints,
    },
    suggested,
    objectifLabel: profile.objectif1Type ?? profile.objectif ?? null,
    competition,
    blocksDone,
  };
}

/** Démarre un nouveau bloc (change de thème : interrompt la progression du bloc en cours). */
export async function startTrainingBlock(input: {
  slug: string;
  theme: string;
  weeks: number;
  weakPoints: string[];
}): Promise<{ ok: boolean }> {
  const userId = await getUserId();
  if (!userId) return { ok: false };
  const allowed = themesFor(input.slug).some((t) => t.id === input.theme && !t.auto);
  const weeks = (COACH_PARAMS.blockWeeksOptions as readonly number[]).includes(input.weeks) ? input.weeks : COACH_PARAMS.blockWeeksDefault;
  if (!allowed) return { ok: false };
  const validIds = new Set(WEAK_POINT_OPTIONS.map((o) => o.movementId));
  const weakPoints = input.theme === "points_faibles" ? input.weakPoints.filter((id) => validIds.has(id)).slice(0, MAX_WEAK_POINTS) : [];
  await prisma.trainingBlock.updateMany({ where: { userId, programme: input.slug, active: true }, data: { active: false } });
  await prisma.trainingBlock.create({
    data: { userId, programme: input.slug, theme: input.theme, weeks, startDate: mondayOf(todayKey()), weakPoints },
  });
  revalidatePath("/dashboard");
  revalidatePath("/profile/edit");
  return { ok: true };
}
