import "server-only";
import { prisma } from "./prisma";
import { mondayOf } from "./week";
import { cycleForWeek, type WeekAlternance } from "./week-cycle";
import type { WeekCycle } from "@/app/signup/actions";

/**
 * Semaine effective pour une date : la modification propre à cette semaine si elle existe, sinon
 * l'alternance A/B si elle est active, sinon la semaine type du profil (partie 3, mission 7).
 */
export async function effectiveWeekCycle(userId: string, base: unknown, dateKey: string): Promise<unknown> {
  const weekStart = mondayOf(dateKey);
  const [row, profile] = await Promise.all([
    prisma.weekOverride.findUnique({ where: { userId_weekStart: { userId, weekStart } }, select: { cycle: true } }),
    prisma.profile.findUnique({ where: { userId }, select: { weekAlternance: true } }),
  ]);
  const overrides = row ? { [weekStart]: row.cycle as unknown as WeekCycle } : {};
  const alternance = (profile?.weekAlternance as unknown as WeekAlternance | null) ?? null;
  return cycleForWeek(weekStart, (base as WeekCycle | null) ?? null, overrides, alternance) ?? base;
}
