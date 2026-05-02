import { cookies } from "next/headers";
import {
  getTemplate,
  resolveAdaptiveDay,
  type Day,
  type ProgramTemplate,
} from "./programming";

const COOKIE_PROGRAM = "el_coach_program";
const COOKIE_FATIGUE = "el_coach_fatigue";
const COOKIE_START_DATE = "el_coach_start";
const COOKIE_WEEK_ORDER = "el_coach_week_order";

export type DemoState = {
  programSlug: string | null;
  fatigueScore: number | null;
  startDate: Date | null;
  weekOrder: number[] | null; // ordre custom des jours (ex: [3,1,2,4,5,6,7])
};

export async function getDemoState(): Promise<DemoState> {
  const jar = await cookies();
  const programSlug = jar.get(COOKIE_PROGRAM)?.value ?? null;
  const fatigueRaw = jar.get(COOKIE_FATIGUE)?.value;
  const startRaw = jar.get(COOKIE_START_DATE)?.value;
  const orderRaw = jar.get(COOKIE_WEEK_ORDER)?.value;

  let weekOrder: number[] | null = null;
  if (orderRaw) {
    const parsed = orderRaw.split(",").map((n) => parseInt(n, 10));
    if (parsed.length === 7 && parsed.every((n) => n >= 1 && n <= 7) && new Set(parsed).size === 7) {
      weekOrder = parsed;
    }
  }

  return {
    programSlug,
    fatigueScore: fatigueRaw ? Number(fatigueRaw) : null,
    startDate: startRaw ? new Date(startRaw) : null,
    weekOrder,
  };
}

/** Renvoie les jours de la programmation réordonnés selon weekOrder, ou ordre par défaut. */
export function orderedWeek(template: ProgramTemplate, weekOrder: number[] | null): Day[] {
  const days = template.weeks[0]?.days ?? [];
  if (!weekOrder) return days;
  return weekOrder
    .map((dayNum) => days.find((d) => d.day === dayNum))
    .filter((d): d is Day => d !== undefined);
}

/**
 * 1 = lundi, 7 = dimanche (ISO).
 */
export function todayDayNumber(now: Date = new Date()): number {
  const js = now.getDay(); // 0 = dim, 1 = lun, ...
  return js === 0 ? 7 : js;
}

export type TodaySession = {
  template: ProgramTemplate;
  day: Day;
  dayNumber: number;
  weekNumber: number;
  needsFatigueInput: boolean;
};

export function resolveTodaySession(
  programSlug: string,
  fatigueScore: number | null,
  overrideDayNumber?: number,
): TodaySession | null {
  const template = getTemplate(programSlug);
  if (!template) return null;

  const dayNumber = overrideDayNumber ?? todayDayNumber();
  const week = template.weeks[0];
  const day = week.days.find((d) => d.day === dayNumber);
  if (!day) return null;

  if (day.adaptive) {
    if (fatigueScore === null) {
      return {
        template,
        day,
        dayNumber,
        weekNumber: week.weekNumber,
        needsFatigueInput: true,
      };
    }
    return {
      template,
      day: resolveAdaptiveDay(day, fatigueScore),
      dayNumber,
      weekNumber: week.weekNumber,
      needsFatigueInput: false,
    };
  }

  return {
    template,
    day,
    dayNumber,
    weekNumber: week.weekNumber,
    needsFatigueInput: false,
  };
}

export function weekOverview(template: ProgramTemplate): Day[] {
  return template.weeks[0]?.days ?? [];
}

export const DAY_SHORT_NAMES = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
export const DAY_FULL_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export const COOKIE_KEYS = {
  program: COOKIE_PROGRAM,
  fatigue: COOKIE_FATIGUE,
  startDate: COOKIE_START_DATE,
  weekOrder: COOKIE_WEEK_ORDER,
} as const;
