"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/user-id";
import { addWeeks } from "@/lib/week";
import { alternanceLetter, cycleForWeek, isEmptyCycle, type WeekAlternance } from "@/lib/week-cycle";
import type { WeekCycle, WeekCycleDayKey } from "@/app/signup/actions";

/** Portée d'une modification : cette semaine, 4 semaines, alternance A/B, ou la semaine type. */
export type WeekChangeScope = "this" | "four" | "ab" | "always";

export type WeekState = { overrides: Record<string, WeekCycle>; alternance: WeekAlternance | null };

/** Modifications de semaine déjà enregistrées (par lundi) et alternance A/B éventuelle. */
export async function getWeekState(): Promise<WeekState> {
  const userId = await getUserId();
  if (!userId) return { overrides: {}, alternance: null };
  const [rows, profile] = await Promise.all([
    prisma.weekOverride.findMany({ where: { userId } }),
    prisma.profile.findUnique({ where: { userId }, select: { weekAlternance: true } }),
  ]);
  return {
    overrides: Object.fromEntries(rows.map((r) => [r.weekStart, r.cycle as unknown as WeekCycle])),
    alternance: (profile?.weekAlternance as unknown as WeekAlternance | null) ?? null,
  };
}

export async function getWeekOverrides(): Promise<Record<string, WeekCycle>> {
  return (await getWeekState()).overrides;
}

function patchDays(from: WeekCycle, cycle: WeekCycle, days: WeekCycleDayKey[]): WeekCycle {
  const out = { ...from };
  for (const d of days) out[d] = cycle[d];
  return out;
}

const json = (v: unknown) => v as Prisma.InputJsonValue;

/** Crée l'alternance : la semaine affichée devient la semaine A, la suivante la semaine B (copies). */
export async function startAlternance(input: { weekStart: string; cycle: WeekCycle }): Promise<{ ok: boolean }> {
  const userId = await getUserId();
  if (!userId) return { ok: false };
  const alt: WeekAlternance = { a: input.cycle, b: JSON.parse(JSON.stringify(input.cycle)), anchor: input.weekStart };
  await prisma.profile.update({ where: { userId }, data: { weekAlternance: json(alt) } });
  revalidatePath("/dashboard");
  revalidatePath("/checkin");
  return { ok: true };
}

/** « Supprimer l'alternance A/B » : toutes les semaines reprennent la semaine type, sauf celles modifiées ponctuellement. */
export async function removeAlternance(): Promise<{ ok: boolean }> {
  const userId = await getUserId();
  if (!userId) return { ok: false };
  await prisma.profile.update({ where: { userId }, data: { weekAlternance: Prisma.DbNull } });
  revalidatePath("/dashboard");
  revalidatePath("/checkin");
  return { ok: true };
}

/**
 * Applique la modification de `days` (jours touchés) avec la portée choisie :
 *  - this   : la semaine affichée seulement ;
 *  - four   : la semaine affichée et les 3 suivantes (chacune garde ses autres jours) ;
 *  - ab     : la semaine A ou B affichée de l'alternance ;
 *  - always : la semaine type ; avec une alternance, le jour change aussi dans A et dans B.
 * `cycle` est la semaine complète telle qu'affichée (sert de base quand la semaine type est vide).
 */
export async function applyWeekChange(input: {
  weekStart: string;
  cycle: WeekCycle;
  days: WeekCycleDayKey[];
  scope: WeekChangeScope;
}): Promise<{ ok: boolean }> {
  const userId = await getUserId();
  if (!userId || input.days.length === 0) return { ok: !!userId };
  try {
    const profile = await prisma.profile.findUnique({ where: { userId }, select: { weekCycle: true, weekAlternance: true } });
    const base = (profile?.weekCycle as unknown as WeekCycle | null) ?? null;
    const alt = (profile?.weekAlternance as unknown as WeekAlternance | null) ?? null;
    const rows = await prisma.weekOverride.findMany({ where: { userId } });
    const overrides = Object.fromEntries(rows.map((r) => [r.weekStart, r.cycle as unknown as WeekCycle]));

    if (input.scope === "always") {
      await prisma.profile.update({
        where: { userId },
        data: {
          weekCycle: json(patchDays(isEmptyCycle(base) ? input.cycle : (base as WeekCycle), input.cycle, input.days)),
          ...(alt ? { weekAlternance: json({ ...alt, a: patchDays(alt.a, input.cycle, input.days), b: patchDays(alt.b, input.cycle, input.days) }) } : {}),
        },
      });
      // La semaine affichée suit aussi le changement si elle avait sa propre modification.
      const own = overrides[input.weekStart];
      if (own) {
        await prisma.weekOverride.update({
          where: { userId_weekStart: { userId, weekStart: input.weekStart } },
          data: { cycle: json(patchDays(own, input.cycle, input.days)) },
        });
      }
    } else if (input.scope === "ab") {
      if (!alt) return { ok: false };
      const letter = alternanceLetter(alt.anchor, input.weekStart);
      const next: WeekAlternance =
        letter === "A" ? { ...alt, a: patchDays(alt.a, input.cycle, input.days) } : { ...alt, b: patchDays(alt.b, input.cycle, input.days) };
      await prisma.profile.update({ where: { userId }, data: { weekAlternance: json(next) } });
    } else {
      const count = input.scope === "four" ? 4 : 1;
      for (let i = 0; i < count; i++) {
        const weekStart = addWeeks(input.weekStart, i);
        const found = cycleForWeek(weekStart, base, overrides, alt);
        const current = isEmptyCycle(found) ? input.cycle : (found as WeekCycle);
        const cycle = json(patchDays(current, input.cycle, input.days));
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

/** « Rétablir la semaine standard » : remet la semaine AFFICHÉE à la semaine type (modifications ponctuelles supprimées). */
export async function resetWeekOverride(weekStart: string): Promise<{ ok: boolean }> {
  const userId = await getUserId();
  if (!userId) return { ok: false };
  await prisma.weekOverride.deleteMany({ where: { userId, weekStart } });
  revalidatePath("/dashboard");
  revalidatePath("/checkin");
  return { ok: true };
}
