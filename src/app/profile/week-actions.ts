"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/user-id";
import { addWeeks } from "@/lib/week";
import type { WeekCycle } from "@/app/signup/actions";
import type { Prisma } from "@prisma/client";

export type WeekChangeScope = "this" | "four" | "always";

/** Modifications de semaine déjà enregistrées, par lundi (YYYY-MM-DD). */
export async function getWeekOverrides(): Promise<Record<string, WeekCycle>> {
  const userId = await getUserId();
  if (!userId) return {};
  const rows = await prisma.weekOverride.findMany({ where: { userId } });
  return Object.fromEntries(rows.map((r) => [r.weekStart, r.cycle as unknown as WeekCycle]));
}

/**
 * Applique une modification de semaine (1.5 / 2.8) :
 *  - this   : la semaine affichée seulement ;
 *  - four   : la semaine affichée et les 3 suivantes ;
 *  - always : la semaine type change (les semaines non modifiées suivent).
 */
export async function applyWeekChange(input: {
  weekStart: string;
  cycle: WeekCycle;
  scope: WeekChangeScope;
}): Promise<{ ok: boolean }> {
  const userId = await getUserId();
  if (!userId) return { ok: false };
  const cycle = input.cycle as unknown as Prisma.InputJsonValue;
  try {
    if (input.scope === "always") {
      await prisma.profile.update({ where: { userId }, data: { weekCycle: cycle } });
      // La semaine affichée suit désormais la semaine type.
      await prisma.weekOverride.deleteMany({ where: { userId, weekStart: input.weekStart } });
    } else {
      const count = input.scope === "four" ? 4 : 1;
      for (let i = 0; i < count; i++) {
        const weekStart = addWeeks(input.weekStart, i);
        await prisma.weekOverride.upsert({
          where: { userId_weekStart: { userId, weekStart } },
          create: { userId, weekStart, cycle },
          update: { cycle },
        });
      }
    }
  } catch (err) {
    console.error("applyWeekChange:", err);
    return { ok: false };
  }
  revalidatePath("/dashboard");
  revalidatePath("/checkin");
  return { ok: true };
}

/** « Rétablir la semaine standard » : remet la semaine AFFICHÉE à la semaine type. */
export async function resetWeekOverride(weekStart: string): Promise<{ ok: boolean }> {
  const userId = await getUserId();
  if (!userId) return { ok: false };
  await prisma.weekOverride.deleteMany({ where: { userId, weekStart } });
  revalidatePath("/dashboard");
  revalidatePath("/checkin");
  return { ok: true };
}
