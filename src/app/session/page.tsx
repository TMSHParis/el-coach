import { redirect } from "next/navigation";
import { getDemoState, resolveTodaySession } from "@/lib/demo-session";
import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/date-key";
import { adaptDayForInjuries, detectInjuryAreas, reduceVolume } from "@/lib/session-adapt";
import { toDisplayBlocks, defaultRuntimeFormat, defaultDurationMinutes } from "@/lib/session-format";
import { minutesToHM } from "../dashboard/dashboard-helpers";
import { SessionRunnerV2 } from "./session-runner-v2";
import { sessionFontVariables } from "./session-fonts";

export const metadata = { title: "Séance en cours — EL COACH METHOD" };

export default async function SessionPage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  const { variant: variantParam } = await searchParams;
  const variant = variantParam === "b" ? "b" : "a";

  const demo = await getDemoState();
  if (!demo.programSlug) redirect("/onboarding");

  const today = resolveTodaySession(demo.programSlug, demo.fatigueScore);
  if (!today || today.needsFatigueInput || today.day.blocks.length === 0) {
    redirect("/dashboard");
  }

  const userId = await getUserId();
  const [profile, todayCheckin] = userId
    ? await Promise.all([
        prisma.profile.findUnique({ where: { userId } }),
        prisma.checkin.findUnique({ where: { userId_date: { userId, date: todayKey() } } }),
      ])
    : [null, null];

  const injuryAreas = detectInjuryAreas(
    profile?.blessures ? profile.blessuresDetail : null,
    todayCheckin?.douleur ? todayCheckin.douleurDetail : null,
  );
  const { day: safeDay } = adaptDayForInjuries(today.day, injuryAreas);
  const day = variant === "b" ? reduceVolume(safeDay) : safeDay;

  const displayBlocks = toDisplayBlocks(day.blocks);
  const initial = day.blocks.map((b) => ({
    format: defaultRuntimeFormat(b),
    durationMin: defaultDurationMinutes(b),
    tabataRounds: b.rounds ?? 8,
  }));

  return (
    <div className={sessionFontVariables}>
      <SessionRunnerV2
        sessionName={`${today.template.name} — ${today.day.focus}`}
        sessionMeta={`${minutesToHM(day.estimatedMinutes)} · ${displayBlocks.length} blocs`}
        blocks={displayBlocks}
        initial={initial}
      />
    </div>
  );
}
