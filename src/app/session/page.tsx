import { redirect } from "next/navigation";
import { getDemoState, resolveTodaySession } from "@/lib/demo-session";
import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/date-key";
import type { Day } from "@/lib/programming";
import { adaptDayForInjuries, detectInjuryAreas, reduceVolume } from "@/lib/session-adapt";
import { toDisplayBlocks, defaultRuntimeFormat, defaultDurationMinutes } from "@/lib/session-format";
import { minutesToHM } from "../dashboard/dashboard-helpers";
import { buildAdviceSession, type StoredAdvice } from "@/lib/advice-session";
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
  if (!today) redirect("/dashboard");

  const userId = await getUserId();
  const [profile, todayCheckin, dbOutput] = userId
    ? await Promise.all([
        prisma.profile.findUnique({ where: { userId } }),
        prisma.checkin.findUnique({ where: { userId_date: { userId, date: todayKey() } } }),
        prisma.dashboardOutput.findUnique({ where: { userId_date: { userId, date: todayKey() } } }),
      ])
    : [null, null, null];

  const output = dbOutput?.output as { generatedDay?: Day; mode?: string; advice?: StoredAdvice } | null;

  // Jour hors ECM (sport libre) ou repos : la séance est la routine en 3 blocs
  // générée au check-in — même moteur de chrono, sans variante allégée.
  if (output?.mode === "advice" && output.advice) {
    const advice = buildAdviceSession(todayCheckin?.seance ?? null, output.advice);
    return (
      <div className={sessionFontVariables}>
        <SessionRunnerV2
          sessionName={advice.titre}
          sessionMeta={`${advice.dureeEstimee} · ${advice.blocks.length} blocs`}
          blocks={advice.blocks}
          initial={advice.blocks.map(() => ({ format: "nft" as const, durationMin: 10, tabataRounds: 8 }))}
          date={todayKey()}
          variant="A"
        />
      </div>
    );
  }

  const generatedDay = output?.generatedDay;

  // Sans séance générée, on retombe sur le programme fixe hebdomadaire — mêmes
  // garde-fous qu'avant (jour adaptatif pas encore calibré / jour de repos).
  if (!generatedDay && (today.needsFatigueInput || today.day.blocks.length === 0)) {
    redirect("/dashboard");
  }

  const baseDay = generatedDay ?? today.day;
  const sessionTitle = generatedDay ? baseDay.focus : `${today.template.name} — ${baseDay.focus}`;

  const injuryAreas = detectInjuryAreas(
    profile?.blessures ? profile.blessuresDetail : null,
    todayCheckin?.douleur ? todayCheckin.douleurDetail : null,
  );
  const { day: safeDay } = adaptDayForInjuries(baseDay, injuryAreas);
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
        sessionName={sessionTitle}
        sessionMeta={`${minutesToHM(day.estimatedMinutes)} · ${displayBlocks.length} blocs`}
        blocks={displayBlocks}
        initial={initial}
        date={todayKey()}
        variant={variant === "b" ? "B" : "A"}
      />
    </div>
  );
}
