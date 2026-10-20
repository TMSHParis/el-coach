import "server-only";
import { prisma } from "./prisma";
import { mondayOf } from "./week";

/**
 * Semaine type effective pour une date : la modification de cette semaine-là
 * si elle existe, sinon la semaine type du profil (1.5 — une semaine sans
 * modification reprend la semaine type).
 */
export async function effectiveWeekCycle(userId: string, base: unknown, dateKey: string): Promise<unknown> {
  const row = await prisma.weekOverride.findUnique({
    where: { userId_weekStart: { userId, weekStart: mondayOf(dateKey) } },
    select: { cycle: true },
  });
  return row?.cycle ?? base;
}
