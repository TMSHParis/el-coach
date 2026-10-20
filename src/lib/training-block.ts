import "server-only";
import { prisma } from "./prisma";
import { COACH_PARAMS } from "./coach-params";
import { blockWeekInfo, defaultThemeFor, type BlockWeekInfo } from "./training-themes";
import { mondayOf } from "./week";

export type ActiveBlock = {
  id: string;
  programme: string;
  theme: string;
  weeks: number;
  startDate: string;
  weakPoints: string[];
  info: BlockWeekInfo;
};

/** Bloc actif du programme ; créé en « Équilibré » (5 semaines) au premier besoin. */
export async function getOrCreateActiveBlock(userId: string, slug: string, todayKey: string): Promise<ActiveBlock> {
  let row = await prisma.trainingBlock.findFirst({
    where: { userId, programme: slug, active: true },
    orderBy: { createdAt: "desc" },
  });
  if (!row) {
    row = await prisma.trainingBlock.create({
      data: {
        userId,
        programme: slug,
        theme: defaultThemeFor(slug),
        weeks: COACH_PARAMS.blockWeeksDefault,
        startDate: mondayOf(todayKey),
      },
    });
  }
  return {
    id: row.id,
    programme: row.programme,
    theme: row.theme,
    weeks: row.weeks,
    startDate: row.startDate,
    weakPoints: row.weakPoints,
    info: blockWeekInfo(row.startDate, row.weeks, todayKey),
  };
}
