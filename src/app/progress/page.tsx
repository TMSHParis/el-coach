import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { dateKey } from "@/lib/date-key";
import { BackHomeButton } from "@/components/back-home-button";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import type { EcmScore } from "@/lib/coaching-adaptatif-mock";
import { ProgressCharts, type WeightPoint, type ScorePoint } from "./progress-charts";

export const metadata = { title: "Ma progression — EL COACH METHOD" };

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateKey(d);
}

/** Jours consécutifs (calendaires) se terminant au dernier check-in — courant + record. */
function computeStreaks(sortedDates: string[]): { current: number; best: number } {
  if (sortedDates.length === 0) return { current: 0, best: 0 };

  let best = 1;
  let run = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const cur = new Date(sortedDates[i]);
    const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
    run = diffDays === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }

  const today = dateKey(new Date());
  const yesterday = daysAgo(1);
  const last = sortedDates[sortedDates.length - 1];
  if (last !== today && last !== yesterday) return { current: 0, best };

  let current = 1;
  for (let i = sortedDates.length - 1; i > 0; i--) {
    const prev = new Date(sortedDates[i - 1]);
    const cur = new Date(sortedDates[i]);
    const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
    if (diffDays === 1) current++;
    else break;
  }
  return { current, best };
}

export default async function ProgressPage() {
  const userId = await getUserId();
  if (!userId) {
    return (
      <section className="mx-auto max-w-lg px-6 py-24 text-center">
        <div className="label">[ PROGRESSION ]</div>
        <h1 className="mt-4 text-3xl font-semibold">Connecte-toi pour voir ta progression.</h1>
      </section>
    );
  }

  const since30 = daysAgo(30);
  const [checkins30, outputs30, allCheckinDates, sessionsCompleted, checkinsTotal] = await Promise.all([
    prisma.checkin.findMany({
      where: { userId, date: { gte: since30 }, poids: { not: null } },
      select: { date: true, poids: true },
      orderBy: { date: "asc" },
    }),
    prisma.dashboardOutput.findMany({
      where: { userId, date: { gte: since30 } },
      select: { date: true, output: true },
      orderBy: { date: "asc" },
    }),
    prisma.checkin.findMany({ where: { userId }, select: { date: true }, orderBy: { date: "asc" } }),
    prisma.session.count({ where: { userId, completed: true } }),
    prisma.checkin.count({ where: { userId } }),
  ]);

  const weightData: WeightPoint[] = checkins30
    .filter((c) => c.poids && Number(c.poids) > 0)
    .map((c) => ({ date: c.date, kg: Number(c.poids) }));

  const scoreData: ScorePoint[] = outputs30
    .map((o) => {
      const ecm = (o.output as { ecm?: EcmScore } | null)?.ecm;
      return ecm ? { date: o.date, score: ecm.numeric } : null;
    })
    .filter((p): p is ScorePoint => p !== null);

  const { current, best } = computeStreaks(allCheckinDates.map((c) => c.date));

  return (
    <div className={ecmFontVariables} style={{ background: "#080808", minHeight: "100vh", color: "#e0e0e0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 20px 0" }}>
        <BackHomeButton href="/dashboard" label="← Dashboard" />
        <div style={{ fontFamily: "var(--font-bebas, sans-serif)", fontSize: 28, letterSpacing: 3, color: "#fff" }}>
          Ma progression
        </div>
      </div>

      <ProgressCharts
        weightData={weightData}
        scoreData={scoreData}
        stats={{ checkinsTotal, sessionsCompleted, currentStreak: current, bestStreak: best }}
      />
    </div>
  );
}
